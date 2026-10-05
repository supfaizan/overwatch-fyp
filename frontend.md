# Overwatch — Frontend Documentation

Companion to `guide.md` (which covers the product and the backend). This file
documents **what the frontend actually contains today**, written so each entry
can be lifted straight into a Jira ticket.

- §1–§4 are reference material: stack, conventions, routes, design system.
- §5 is the **delivered work** — one entry per shippable unit, with acceptance
  criteria. Create these as `Done` tickets to backfill the board.
- §6 is the **backlog** — everything the UI still needs. Create these as `To Do`.
- §7 records decisions a reviewer would otherwise question.

Suggested Jira key: `FE`. Numbers below are stable references for this doc, not
Jira ids.

---

## 1. Stack

| Concern | Choice | Notes |
| --- | --- | --- |
| Framework | Next.js 16.2.9, App Router, Turbopack | Middleware is renamed `proxy.ts` in 16 |
| UI | React 19.2.4, TypeScript 5 | |
| Styling | Tailwind CSS v4 | Tokens as CSS custom properties, no config file |
| Primitives | `radix-ui` + shadcn-style wrappers | 18 components in `components/ui/` |
| Server state | TanStack Query v5 | `staleTime: 30s`, `retry: 1`, no refetch on focus |
| Client state | Zustand v5 | Global stores in `stores/`, feature stores in `features/**/stores/` |
| Forms | react-hook-form + Zod v4 | via `@hookform/resolvers` |
| Graph | `@xyflow/react` (React Flow 12) | Custom node type |
| HTTP | Axios (single shared instance) | `lib/axios.ts` |
| Realtime | `socket.io-client` | Singleton exists, **not yet consumed** — see FE-B3 |
| Toasts | `sonner` | |
| Icons | `lucide-react` | |
| Fonts | IBM Plex Sans (prose, labels), Source Code Pro (data) | via `next/font/google` |

---

## 2. Architecture conventions

These are enforced by convention across every feature. A reviewer should reject
code that breaks them.

**Feature-sliced structure.** Each feature owns its full vertical slice:

```
features/<area>/
├── index.tsx          # the feature's root component
├── types.ts           # domain types for this feature only
├── schemas.ts         # Zod schemas (forms only)
├── api/
│   ├── index.ts       # request functions — the ONLY place URLs are built
│   └── query-keys.ts  # query key factory
├── hooks/index.ts     # react-query wrappers + feature logic ("use client")
├── components/        # presentational + interactive pieces
├── static/index.ts    # mock datasets and presentational meta maps
└── stores/            # feature-local Zustand state
```

**Pages are thin.** Every `app/**/page.tsx` does nothing but render a feature
root. No data fetching, no layout, no logic in the route file.

**One mock switch.** `USE_MOCK` in `constants/index.ts` is the single flag. Each
`api/` function branches on it and returns data from the feature's `static/`,
otherwise calls the real endpoint. No component ever knows whether it is on mock
data. Flipping one boolean moves the whole app to the live backend.

**URLs come from `lib/services.ts`.** `SERVICES.GRAPH`, `SERVICES.TICKETS`, etc.
Literal `/api/...` strings in feature code are a defect.

**One Axios client.** `lib/axios.ts` attaches the Bearer token from the auth
store, logs out on 401, and normalizes errors to `Error(message)`. Features never
create clients or call `fetch` against this backend.

**State split.** Server data → TanStack Query. UI/session state → Zustand.
Cross-feature stores live in `stores/`; anything one feature owns stays in that
feature.

**Route protection is server-side.** `proxy.ts` decodes the JWT `exp` from the
`ow_token` cookie before any JS runs. It is deny-by-default: everything not in
`PUBLIC_ROUTES` requires auth. New protected routes need no wiring.

---

## 3. Route map

| Route | Group | Access | Feature |
| --- | --- | --- | --- |
| `/` | `(public)` | Public | `features/landing` |
| `/login` | `(auth)` | Public, redirects if signed in | `features/auth` → `Login` |
| `/register` | `(auth)` | Public, redirects if signed in | `features/auth` → `Register` |
| `/connect` | `(platform)` | Protected | `features/platform/ingestion` |
| `/training` | `(platform)` | Protected | `features/platform/training` |
| `/dashboard` | `(platform)` | Protected | `features/platform/dashboard` |
| `/tickets` | `(platform)` | Protected | `features/platform/tickets` |

`(platform)` routes share `app/(platform)/layout.tsx`, which renders the `AppBar`
(logo, nav, active repo chip, user menu) above the page.

Onboarding flow: register → `/connect` → `/training` → `/dashboard`.

---

## 4. Design system

Defined as CSS custom properties in `app/globals.css`. Use the tokens, never raw
hex.

Light, PostHog-style theme: warm cream "3000" ramp, orange accent, solid ledges
instead of blurred shadows.

- **Surfaces:** `ink-900` (chrome) → `ink-850` (canvas) → `ink-800` (panels) →
  `surface-1/2/3` (white cards → hover/selected → pressed/tracks). Names are
  roles, not lightness.
- **Lines:** `line-1` (hairline), `line-2` (control borders)
- **Text:** `text-hi` → `text-mid` → `text-lo` → `text-dim`
- **Semantic:** `signal` (PostHog orange — accent, active, selected; the lead
  colour), `success` (green, healthy/live/done), `warn` (amber), `critical`
  (crimson, rationed), `stale` (probabilistic/unverified), `idle`
- **Call to action:** `cta` / `cta-ledge` / `cta-ink` — the yellow pressable
  button face, its ledge, and its text
- **Elevation:** `shadow-ledge` (3px solid ledge), `shadow-card`, `shadow-raised`
- **Type utilities:** `ow-display`, `ow-heading`, `ow-body`, `ow-label`,
  `ow-mono-data`, `ow-micro`
- **Motion/effect utilities:** `ow-panel`, `ow-rise`, `ow-pop`, `ow-live-dot`,
  `ow-scanline`, `ow-grid`, `ow-edge-flow`, `ow-cursor`

Convention: monospace carries data; sans carries prose and labels. Colour encodes
confidence — solid/`signal` for confirmed, dashed/`stale` for probabilistic.

---

## 5. Delivered work

### EPIC A — Foundation & infrastructure

**FE-1 · Application shell, providers and design system**
- *Description:* Root layout with font variables, theme provider (`next-themes`),
  TanStack Query provider with tuned defaults, tooltip provider, and toast host.
  Full token set and typography utilities in `globals.css`.
- *Acceptance criteria:* App renders with both fonts loaded; query client is
  created once per browser session; toasts display from any feature; all colours
  resolve from CSS variables.
- *Files:* `app/layout.tsx`, `components/providers/*`, `app/globals.css`
- *Status:* Done

**FE-2 · Shared HTTP client with auth and error handling**
- *Description:* Single Axios instance. Request interceptor injects
  `Authorization: Bearer <token>` from the auth store. Response interceptor
  triggers logout on 401 and rethrows a normalized `Error`.
- *Acceptance criteria:* No feature constructs its own client; a 401 from any
  endpoint clears the session and redirects to `/login`; error toasts show the
  server's `message` when present.
- *Files:* `lib/axios.ts`
- *Status:* Done

**FE-3 · Mock data layer behind a single flag**
- *Description:* `USE_MOCK` constant plus a `delay()` helper and a JWT-shaped
  mock token generator, so the whole app is demoable with no backend running.
- *Acceptance criteria:* With `USE_MOCK = true` every screen is fully usable
  offline; the mock token decodes with `jose` so the route guard accepts it;
  flipping to `false` switches every feature to real endpoints with no component
  changes.
- *Files:* `constants/index.ts`, `lib/mock.ts`, every `features/**/api/index.ts`
- *Status:* Done

**FE-4 · Route guard (Next 16 proxy)**
- *Description:* Cookie-based JWT guard running before render. Redirects guests
  to `/login?from=<path>` and bounces signed-in users away from auth pages.
- *Acceptance criteria:* Protected routes are unreachable without a valid
  unexpired token; the guard runs on all routes except API, Next internals and
  static assets; adding a route under `(platform)` needs no guard change.
- *Files:* `proxy.ts`, `constants/index.ts`
- *Status:* Done

**FE-5 · Component primitive library**
- *Description:* 18 Radix-backed primitives themed to the Overwatch tokens —
  avatar, badge, button, card, dialog, dropdown, form, input, label, progress,
  scroll-area, separator, sheet, skeleton, sonner, tabs, textarea, tooltip.
- *Acceptance criteria:* Primitives are theme-aware and keyboard accessible;
  features compose these rather than raw elements for interactive controls.
- *Files:* `components/ui/*`
- *Status:* Done

---

### EPIC B — Authentication

**FE-6 · Login and registration**
- *Description:* Split "console" auth layout shared by both screens. Zod-validated
  forms via react-hook-form. Success sets the session, toasts, and redirects —
  login to `/dashboard`, registration to `/connect`.
- *Acceptance criteria:* Invalid email or a password under 6 characters blocks
  submit with a field-level message; a failed request surfaces an error toast and
  leaves the form filled; a successful login lands on the dashboard already
  authenticated.
- *Files:* `features/auth/**`, `app/(auth)/login/page.tsx`,
  `app/(auth)/register/page.tsx`
- *Status:* Done — **against mock auth** (see FE-B1)

**FE-7 · Session store persisted to cookies**
- *Description:* Zustand auth store writing `ow_token` (raw JWT) and `ow_user`
  (base64 JSON) as cookies rather than localStorage, so `proxy.ts` can read the
  session server-side. Logout clears both and hard-navigates to `/login`.
- *Acceptance criteria:* A reload keeps the user signed in; the proxy sees the
  same token the client holds; logout makes protected routes immediately
  unreachable.
- *Files:* `stores/auth-store.ts`
- *Status:* Done

---

### EPIC C — Marketing site

**FE-8 · Landing page**
- *Description:* Public single-page site: sticky nav, hero with an animated SVG
  architecture graph, problem marquee, six capability cards, the flagship
  contract-checker section with a simulated terminal and confidence bar, the
  five-stage pipeline, confidence legend, CTA, footer.
- *Acceptance criteria:* Renders without client JS beyond animation; all CTAs
  route to `/register` or `/login`; layout holds from mobile to ultrawide.
- *Files:* `features/landing/index.tsx`, `app/(public)/page.tsx`
- *Status:* Done — copy reduced to a minimalist pass; container capped at 1500px
  with 48px gutters

---

### EPIC D — Repository ingestion

**FE-9 · Connect a repository**
- *Description:* Onboarding step 1. URL form validating GitHub/GitLab/Bitbucket
  links, plus one-click sample repositories. On submit the repo is parsed into
  `{name, fullName, provider}`, stored as the active repo, and the user is sent to
  `/training`.
- *Acceptance criteria:* A non-repository URL is rejected with a specific message;
  connecting sets the active repo (persisted to localStorage) and it appears in
  the app bar; sample repos skip straight to training.
- *Files:* `features/platform/ingestion/**`, `app/(platform)/connect/page.tsx`
- *Status:* Done — mock connect

---

### EPIC E — Indexing & training

**FE-10 · Training progress screen**
- *Description:* Onboarding step 2. Radar visual with live percentage, current
  stage label, progress bar, and the eight-stage pipeline list (clone → parse →
  resolve → Neo4j → T-GNN pretrain → fine-tune → BERT embed → finalize). Polls
  every 600ms, stops on completion, marks the repo `ready` and auto-advances to
  `/dashboard`.
- *Acceptance criteria:* Progress advances without user action; polling stops once
  done (no idle network loop); the stage list shows completed/active/pending
  states; revisiting the page restarts the run under mock.
- *Files:* `features/platform/training/**`, `app/(platform)/training/page.tsx`
- *Status:* Done — mock 9s run

---

### EPIC F — Operational dashboard

**FE-11 · Architecture diagram canvas**
- *Description:* React Flow canvas with a custom `ServiceNode`. Nodes are
  risk-coloured from the T-GNN co-change score, grouped FE/BE/Infra, and badged
  with ticket counts. Edges render solid for confirmed dependencies and dashed
  for probabilistic co-change, carrying `CO_CHANGES n/m` labels. Selecting or
  querying spotlights a subgraph and dims the rest.
- *Acceptance criteria:* Graph renders from API data with minimap, controls and
  background grid; probabilistic edges are visually distinct from confirmed ones;
  highlighting a set of nodes dims everything else; clicking a node opens the
  inspector.
- *Files:* `features/platform/dashboard/components/DiagramCanvas.tsx`,
  `components/nodes/ServiceNode.tsx`
- *Status:* Done — mock graph

**FE-12 · Side console with three panels**
- *Description:* Tabbed right-hand console — WARNINGS, CHAT, INSPECT — backed by
  a feature store holding the active panel, selected node and highlighted set.
  Selecting a node on the canvas switches to INSPECT automatically.
- *Acceptance criteria:* Tab switching preserves each panel's state; selecting a
  node routes to the inspector; deselecting returns to warnings.
- *Files:* `features/platform/dashboard/index.tsx`, `stores/dashboard-store.ts`
- *Status:* Done

**FE-13 · Contract warnings panel**
- *Description:* Prioritized list of contract warnings (critical/warning/
  informational) with source → target, risk narrative, T-GNN confidence bar and a
  suggested action. Clicking a warning spotlights the implicated nodes on the
  canvas.
- *Acceptance criteria:* Critical count is summarized in the header; each card is
  clickable and drives the canvas highlight; the list scrolls independently of the
  page.
- *Files:* `features/platform/dashboard/components/WarningsPanel.tsx`
- *Status:* Done — mock warnings

**FE-14 · Grounded chat panel**
- *Description:* Plain-English Q&A over the confirmed graph. Answers highlight the
  nodes they reference. Suggested prompts, auto-scroll, pending state, and an
  explicit refusal when a question falls outside the graph.
- *Acceptance criteria:* Sending a question appends the user message immediately
  and the answer on resolve; referenced nodes highlight on the canvas; an
  unanswerable question returns the grounded fallback rather than a guess.
- *Files:* `features/platform/dashboard/components/ChatPanel.tsx`
- *Status:* Done — canned responses

**FE-15 · Node inspector**
- *Description:* Detail view for a selected service: layer, language, risk score,
  neighbours (marked confirmed vs probabilistic) and any warnings touching it.
- *Acceptance criteria:* Empty state prompts node selection; neighbours are
  derived from real edges; related warnings are filtered by node id.
- *Files:* `features/platform/dashboard/components/NodeInspector.tsx`
- *Status:* Done

**FE-16 · Dashboard fills the viewport without page scroll**
- *Description:* The dashboard is a fixed-height app surface: the page itself
  never scrolls, and each panel scrolls internally.
- *Acceptance criteria:* No page-level scrollbar at any viewport height; the
  warnings, chat and inspector regions each scroll on their own; the canvas
  resizes rather than overflowing.
- *Files:* `features/platform/dashboard/index.tsx` and its panels
- *Status:* Done

---

### EPIC G — Ticket board

**FE-17 · Ticket board page**
- *Description:* New `/tickets` route linked from the app bar. Jira/ClickUp-style
  board: sections are ticket statuses (Backlog, In Progress, In Review, Done),
  cards show the ticket key, title, category, priority and the services the ticket
  affects (the `AFFECTS` relationships from the graph).
- *Acceptance criteria:* Route is auth-protected and reachable from the nav;
  header reports how many tickets are mapped to services; empty sections show a
  drop placeholder; the board scrolls horizontally while each section scrolls
  vertically; the page itself never scrolls.
- *Files:* `features/platform/tickets/**`, `app/(platform)/tickets/page.tsx`
- *Status:* Done — mock tickets

**FE-18 · Drag-and-drop for tickets and sections**
- *Description:* Both board levels are draggable — cards move within and between
  sections, and sections reorder. Implemented on native HTML5 drag events wrapped
  in a single reusable `useDraggable`/`useDroppable` pair, with the in-flight
  payload held in the feature store so drop targets can decide what they accept.
  A card move is applied optimistically, then persisted with a status update.
- *Acceptance criteria:* A card dropped on another card lands at that position; a
  card dropped on empty section space appends; a card cannot be dropped on itself;
  dragging a section reorders the board; drop targets highlight only for a
  compatible drag; a failed persist surfaces an error toast.
- *Files:* `features/platform/tickets/hooks/use-dnd.ts`,
  `stores/tickets-store.ts`, `components/TicketColumn.tsx`, `components/TicketCard.tsx`
- *Status:* Done — desktop pointer only (see FE-B5)

---

## 6. Backlog — tickets to create

**FE-B1 · Wire the real backend**
Flip `USE_MOCK` to `false` and verify every feature against the NestJS API.
Each `api/index.ts` already has the real branch written. Needs: `NEXT_PUBLIC_API_URL`,
endpoint contract confirmation, and error-path testing per feature.
*Blocked on:* backend availability.

**FE-B2 · Real GitHub OAuth**
`GithubButton` currently fires a mock login with a hardcoded identity. Needs the
OAuth redirect flow, callback handling, and token exchange.

**FE-B3 · Consume the WebSocket stream**
`lib/socket.ts` is a working singleton that nothing subscribes to. The documented
events — `graph:update`, `contract:warning`, `ticket:mapped`, `tgnn:scores` —
need feature-level listeners under `features/<area>/sockets/`, each patching the
relevant query cache. This is what makes the product "live" rather than polled.

**FE-B4 · Persist board arrangement**
Section order and card positions reset on reload. Needs either server persistence
or a persisted store slice.

**FE-B5 · Touch support for drag-and-drop**
HTML5 drag events do not fire on touch devices, so the board is desktop-only.
Requires a pointer-events implementation inside `use-dnd.ts` — the two consuming
components would not change.

**FE-B6 · Keyboard-accessible drag-and-drop**
No keyboard path to move a ticket. Needs focusable cards with move commands and
live-region announcements.

**FE-B7 · Ticket → diagram cross-linking**
`guide.md` §3.3 specifies that clicking a ticket highlights the impacted nodes on
the diagram with a confidence score. The data (`impact[]` with BERT scores) is
already on every ticket; the cross-feature navigation is not built.

**FE-B8 · Ticket detail view**
Cards show a summary only. No description, comments, history, or link out to the
provider.

**FE-B9 · Connected repositories list**
`/connect` only creates. `getRepos()` returns an empty array under mock and no
screen lists, switches or disconnects repositories — the app bar repo chip is
hardcoded to `payments-core`.

**FE-B10 · Route-level loading and error boundaries**
No `loading.tsx`, `error.tsx` or `not-found.tsx` in any segment. Failures
currently surface only as toasts.

**FE-B11 · Automated tests**
No test runner is configured. Highest-value first targets: the DnD store
reducers (`moveTicket`, `moveColumn`), the auth store cookie round-trip, and the
proxy guard decision table.

**FE-B12 · Accessibility audit**
Colour-only encoding of confidence and priority needs a non-colour affordance;
canvas and board need a keyboard story; contrast needs verification against the
dim text tokens.

---

## 7. Decisions worth recording

**Cookies, not localStorage, for the session.** The route guard runs before any
client JS, so the token has to be readable server-side. This is the reason the
auth store reaches for `js-cookie` instead of Zustand's `persist`.

**No drag-and-drop library.** The board uses native HTML5 drag events wrapped
once. This avoids a dependency for a single screen, at the cost of touch support
(FE-B5). Both board levels share one implementation, so a future swap to
pointer events or a library is contained to `use-dnd.ts`.

**Board arrangement lives outside react-query.** Ticket order is Zustand state
seeded from query data via an idempotent `hydrate`, keyed on the ticket id set.
Without this, a background refetch would snap a dragged card back mid-gesture.

**`provider` and `confidence` remain in the types but are not rendered.** The
board no longer shows Jira/ClickUp badges or BERT percentages, but both fields
are part of the documented backend contract (`guide.md` §7 — `Ticket.provider`,
`AFFECTS.confidence`), so the types still model them.

**Mock data mirrors real ids.** Ticket `impact[].nodeId` values match the node
ids in the dashboard's mock graph, so cross-feature linking (FE-B7) will work
against mock data without a data rewrite.
