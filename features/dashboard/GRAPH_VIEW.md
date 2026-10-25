# Dashboard diagram: Graph (web) and Tree views

Working notes for whoever picks this up next. Read `AGENTS.md` at the repo root first; this file only adds what is specific to the dashboard diagram.

## Status

| Phase | What | State |
| --- | --- | --- |
| 0 | Layout moved out of the query; focus/dimming logic pulled into a pure function | Done |
| 1 | Force-directed "Graph" view beside the dagre "Tree"; Graph \| Tree selector | Done |
| 1b | UX pass: no overlaps, cleaner lines, focus dims everything unrelated | Done |
| 2 | Polish: names by zoom, colour by top-level folder, nodes glide between layouts (both views) | Done |
| 3 | AI walkthrough: after a chat answer, the diagram steps through the flow it describes, in both views | Done |

All of it is uncommitted on `feat/doc-image-editing`, alongside separate, unrelated chat work in `features/dashboard/chat/` (leave that alone).

Validation at last update: `pnpm exec tsc --noEmit --incremental false`, `pnpm exec oxlint features/dashboard`, `dprint check` and `pnpm exec vitest run features/dashboard` (52 tests) all pass; backend `.venv/bin/pytest tests -m "not regression"` passes. Checked in the browser against the `Team-MyPath/mypath-v3` repo: opening folders in several orders, hover/select focus, chat chip hover and click, Graph ↔ Tree switching, dark mode, and live walkthroughs on DeepSeek via OpenRouter (auto-play after an answer, replay, jumping between steps).

The backend (`overwatch-BE`) also has uncommitted phase 3 changes in `app/query/{schemas,router,service}.py` and `tests/integration/test_query_endpoint.py`, on top of other uncommitted work there.

## How it fits together

Data flow: `hooks.ts useGraphView` fetches the raw `GraphView` (React Query, keyed by the open folders) → `components/diagram-canvas.tsx` lays it out with `useMemo(toCanvas(view, diagram, previous))` → React Flow renders it.

| File | Role |
| --- | --- |
| `index.tsx` | Reads `?diagram=tree` (Graph is the default and is not written to the URL), renders the `SegmentedButton` selector, passes `diagram` to the canvas. |
| `lib/canvas.ts` | `DIAGRAM` constant + `Diagram` type. `toCanvas` picks the layout (force for graph, dagre for tree), merges edges by pair, and puts each node's folder colour on `data.tint`. |
| `lib/force-layout.ts` | `forcePositions(nodes, tree, previous)`: the web layout. Pure and deterministic (d3-force's default random source is seeded per simulation; everything is sorted by id). |
| `lib/layout.ts` | Dagre layout for the Tree view (unchanged). |
| `lib/emphasis.ts` | `emphasis(links, {hovered, selected, highlighted}, repo)`: which node is in focus and each node's opacity. Shared by both views. |
| `lib/appearance.ts` | Edge styles, `moduleTints(view)` folder colours, node descriptions. |
| `lib/ancestors.ts` | `ancestorsOf` (what holds a node, from its id) and `topModuleOf` (its top-level folder). |
| `components/diagram-canvas.tsx` | Styling of nodes and edges per focus, the glide animation, fit-to-content, focus-on-request (chat chip clicks). |
| `components/web-node.tsx`, `web-overflow.tsx`, `web-edge.tsx` | Graph view node, "+N more" marker, and edges (`WebStrand` straight for folder lines, `WebRelation` curved for code relationships). |
| `components/node-card.tsx`, `overflow-node.tsx` | Tree view node and marker. |
| `components/level-control.tsx` | The open/close button shared by both views (`quiet` hides it on open folders in the web). |
| `store.ts` | `useViewStore`: open folders, hover, selection, chat highlight, focus requests, and the walkthrough (`walk`, `startWalk`, `goTo`, `setPlaying`, `endWalk`). The single source of truth for both views; it has no React Flow code. |
| `lib/walkthrough.ts` | Pure walkthrough logic: `foldersToOpen` (respects the open-folder cap), `walkStandIns` (what draws each step), `walkMarks` (badge numbers), `walkPath` (hops so far), `stepName`. |
| `components/walk-player.tsx` | The player shown on the canvas during a walkthrough; owns the step timer. |
| `components/walk-badge.tsx` | Step-number badge on nodes, read from `WalkMarksContext` so node data never changes. |

### Graph layout rules (`lib/force-layout.ts`)

- Only the folder tree places nodes. Code relationships are drawn but do not pull nodes; pulling interleaved folders and crossed their lines.
- Nodes already on screen are anchored (`ANCHOR = 0.3`), so opening a folder grows the web instead of reshuffling it. The canvas keeps the last positions in the `placed` ref and passes them as `previous`.
- New nodes are seeded in a fan pointing away from their folder's own parent. A seat must be clear of placed nodes (`isClear`), its line from the folder must not pass under another node (`isUnblocked`), and it must not cross an existing folder line (`crossesNone`). Otherwise the search tries other angles (`TURNS`), then further out.
- Collision radius (`reach`) covers the circle, the open/close button and the name under it.
- Circle sizes come from `dotSize(label)`; the web node draws at exactly that size, so keep them in sync.

### Focus and dimming

- Hover beats the chat's highlight, which beats the selection (`emphasis`).
- With a node in focus: it, its relationship neighbours, its folder and its contents stay at full strength; other nodes drop to `RECEDED.node`, other lines to `RECEDED.edge`.
- A chat highlight lights the node, or the closed folder holding it (via `ancestorsOf`, which knows packages live in `__external__`).
- Resting relationship lines are quieter in the web (`AT_REST_OPACITY.graph = 0.12`) than in the tree (`0.22`).

### Motion

- Opening/closing a folder: nodes glide from where they were; new nodes glide out of their folder (`startsOf`, `GLIDE_MS`). Skipped when the OS asks for reduced motion.
- `FitToContent` fits to where nodes are heading (not mid-glide positions), once per set of nodes, so it never yanks a viewport the user moved.
- Switching Graph ↔ Tree re-lays out without a glide.

## Practices to keep

- Follow `AGENTS.md`: feature-owned code stays in `features/dashboard`; no cross-feature imports; Tailwind tokens from `app/globals.css` (colours here use `--color-accent-*`, `--color-success`, `--color-primary`, `--color-muted`); no new dependencies without approval.
- Style: dprint (`pnpm fmt`), braces on every `if`, arrow functions always use a braced body with `return`. No magic strings: use constants such as `DIAGRAM`, `JOB_STATUS`, `EXTERNAL_MODULE`.
- Comments are short and explain why, matching the surrounding files. No banner comments. Nothing may mention AI tools, in code, docs, commits or PRs.
- Keep layout and focus logic pure in `lib/` with Vitest tests beside them (`*.test.ts`, node environment). Components only wire state to React Flow.
- React Flow specifics learned the hard way:
  - `defaultEdgeOptions.type` is not applied to edges you pass in; set `type` on each edge.
  - Edges need handles on both nodes to render; web nodes have invisible ones (`hiddenHandle`).
  - `onPaneMouseMove` also fires over nodes (they sit inside the pane); check `event.target === event.currentTarget`.
  - A node handed over as a new object is re-measured; `restyleNodes` reuses unchanged ones.
  - `getNodesBounds` without a `nodeLookup` logs a dev warning; bounds are computed inline in `FitToContent`.
  - The backend's `containment` already includes overflow markers (`container > container::more`); don't add those lines again, or keys collide.
- In the zsh environment `grep` is aliased to `rg`; use `rtk proxy grep` for grep syntax.

## How to verify changes

1. `pnpm exec tsc --noEmit --incremental false`, `pnpm exec oxlint features/dashboard`, `pnpm exec dprint check <files>`, `pnpm exec vitest run features/dashboard`.
2. In the browser (dev server on :3000, backend on :8000), on `/dashboard` with the mypath repo: open `packages`, `apps` and `external dependencies` in different orders. Check for overlapping nodes, lines under circles, and that existing nodes stay put. Hover and select nodes, hover and click chat chips (the "what is this repository about" conversation has many), switch to Tree and back, and try dark mode. Watch the Next.js dev overlay for console errors.
3. To debug a layout offline: dump node positions, sizes, names and edge ids from the DOM before and after opening a folder (each `.react-flow__node` has `data-id` and a `translate(...)` transform; edge ids are `parent>child` for folder lines and `a->b` for relationships), then replay `forcePositions(after, tree, previousPositions)` in a temporary Vitest file and list overlapping pairs. The result matches the browser exactly.

## Known issues and leftovers

- After the simulation settles, a few dependency lines can still pass close to another cluster (seeding avoids it, the simulation can drift slightly). Further improvement would need edge routing or a radial layout.
- Tree view crops wide trees: fit stops at 55% zoom (`FIT.minZoom`), kept for readability. This predates the graph work.
- The relationship check behind "can't be determined" answers is still strict (parked: accept a claimed relation when the two nodes are connected in context by any edge).

## Walkthrough (phase 3, steps in the answer)

- **One model call.** A flow question's answer is the walkthrough. The prompt (`overwatch-BE/app/query/prompts/answer.md`, loaded by `app/query/service.py` with `$name` placeholders filled from constants) asks for a short summary, a `STEPS:` line, then `1. [n4] what happens there [s3:42-58]` lines. `app/query/grounding.py` `_split_steps` cuts them out after the usual reference and code checks: a step's node is its first `[nX]`, its code the first `[cN]`; a line without a known node joins the step before; consecutive steps on one node merge; fewer than 2 steps leaves the text as a normal list (minus the bare `STEPS:` line); at most 12.
- **Stored on the message** as `steps: [{ref, node_id, text, citation_ref}]` (Mongo, no migration; older messages load with `[]`). Follow-ups see the steps as names (`steps_markdown` + `plain_text`). Code citations are no longer capped (a citation still shows at most 60 lines).
- **Frontend:** `chat/components/chat-message.tsx` renders the summary, then `Steps` (numbered cards: node name, text, the step's code card) and the remaining "Cited code". The walk in `store.ts` carries `answerId`, so the card for the step on the canvas is lit and scrolled into view; clicking a card jumps there and pauses (`startWalk(..., answerId, cursor)` when another answer's walk is showing). `chat/index.tsx` auto-plays a new answer's steps once; "Walk through" replays with no network call. `hooks.ts useWalkthrough(repo).play(answerId, nodeIds, cursor?)` is synchronous.
- **Each step** goes through the normal focus path with `follow: true`: open the folders holding it (unless that passes `max_expanded`; then a closed folder stands in), select it, and pan only if it's off the middle or zoomed out past `FOLLOW_ZOOM`. The player waits for `focusRequest` to settle before moving on.
- **Look:** walked steps full strength, upcoming at half, everything else receded; the current step has the selection ring and a filled badge. The path follows relationship lines or a dashed line where there's none.
- **Stopping:** opening/closing a folder, selecting or clicking the canvas pauses; Esc or × ends; switching repo clears it.
- **`/query/flow`** is removed from the backend (router, `flow()`, `build_flow_context`, `generate_json` and their tests); walkthroughs come only from an answer's steps.
- **Streaming:** `chat/api.ts askStream` reads `/chat/ask/stream` through `api.stream` in `shared/api/client.ts` (axios fetch adapter, `responseType: 'stream'`), so auth headers, refresh on 401 and error envelopes are the shared client's; the response interceptor reads a streamed error body before handling it.
- **Model:** any OpenAI-compatible API via `MODEL_API_KEY`, `MODEL_BASE_URL`, `MODEL_NAME` (currently OpenRouter `deepseek/deepseek-v4.1-flash` on a small prepaid balance: keep live calls few). `uvicorn --reload` doesn't watch `.env`; touch a `.py` file after changing it.

## Chat session

- The open conversation is kept per user, workspace and repo in `chat/store.ts` (`useChatSession`, sessionStorage `overwatch:chat-conversations`): closing and reopening the chat or reloading the tab returns to it; a new tab starts fresh. A stored id that's gone (`conversation_not_found`) is cleared.
- Once opened, the chat stays mounted and `ChatDock hidden` hides it, so closing mid-answer keeps the stream and draft.

## Ideas not started

- Retrieval coverage: the ask context only reaches files the question names, what's selected/mentioned/open, and depth-1 relations of the top matches, so a flow can stop at a file whose next hop wasn't retrieved. Decided 2026-10-24: (A) follow graph edges from the best hits and add a compact file/symbol map, then (C) let the model look things up with tools (graph search, neighbours, file read, grep) in a short loop. Phase A done 2026-10-24 (backend `overwatch-BE`, uncommitted):
  - A0 indexer: imports of the repo's own packages resolve through their `package.json` `exports`/entry (`project_config.WorkspacePackage`), nested tsconfigs apply to files under them (`TsScope`), default imports resolve to the target's `export default`, and names are followed through barrel re-exports (`export {…} from`, `export * from`, up to 3 files). `PARSER_VERSION` 3 and `GRAPH_BUILD_VERSION` 2 force a full rebuild on the next sync.
  - A1 search: "signs up" is also searched as `signup` (`_PHRASAL_VERBS` + particles), verb endings are trimmed, filler words dropped, and hits ranked by how well the name fits (`rank_matches`).
  - A2 following: from the best file/function matches, `store.follow` walks calls, requests, extends/implements and route handlers (and, separately, renders) up to 3 hops; those nodes and edges go in the context under "Followed from the matches" and their code is shown, best match's chain first, logic before rendering.
  - A3 file map: files carry `rank` (usage) and `key_symbols` at index time; the context lists up to 40 under "Files in the repository", near the matches first.
  - Verified live: "walk me through what happens when a student signs up" now traces page → SignupForm → useRegister → OTP redirect, and the Google path → redirectAfterLogin.
  Phase C done 2026-10-24: the model can look things up before answering (`overwatch-BE/app/query/tools.py`): `search_graph`, `related` (what a node uses / what uses it), `read_code` (a ref, or lines of an indexed file), `grep_code`. Each lookup is rendered by the question's `ContextBuilder` (`look_up`), so its refs and `sN` sources continue the context's numbering and pass the same grounding checks. The loop is in `app/query/service.py answer_stream`: no fixed rounds; it stops when the model answers, at `CHAT_MAX_LOOKUPS` (default 20, 0 = off), or once `LOOKING_SECONDS` (45s) have passed; then `tool_choice: none` plus a closing "answer now" message (`ANSWER_NOW`) force the answer. DeepSeek sometimes writes tool calls into the reply as DSML markup instead of making them: `llm.calls_written_as_text` reads them as calls while looking is allowed and strips them otherwise; a reply that is only markup becomes `LOOKUPS_RAN_OUT` (not grounded), so markup is never saved as an answer. Measured: a broad question took 44s, 5 rounds/20 lookups, ~$0.0066 in 6 calls. Text before a lookup is shown as thinking; the reply streams once it starts with its header. The chat streams each lookup as a `status` event, shown under the reasoning in `answer-draft.tsx`. Verified live: an OTP question made 9 lookups and walked OtpForm → verifyEmail → useVerifyEmail → redirectAfterLogin.
- **AI usage counting (for billing plans), decided 2026-10-24.** A question counts once against the asker's hourly and daily limits and the workspace limits (`app/chat/limits.take`, charged just before the first model call). Each further model call the answer makes while looking things up (phase C) counts only against the global daily budget (`chat:global:{day}`, `chat_daily_budget`). When that budget is spent, looking stops and the model answers with what it has, so a question is never cut off mid-way. Phase C has no fixed number of rounds: the model stops when it has enough, with backstops on time and total tool calls. Token usage and provider cost per model call are logged as `llm_usage` (`prompt_tokens`, `completion_tokens`, `cost`), and `llm_lookups` logs lookups and rounds per answer, so cost per question can be measured before pricing.
- **Answer speed, measured 2026-10-25** (the broad "how does the AI chat work… complete details" question, in-process, same code):

  | OpenRouter routing | Time (two runs) | Cost per question | Notes |
  | --- | --- | --- | --- |
  | session id only | 46.8s, 26.9s | ~$0.005 | slow providers (Relace, Baidu); the final answer still switched provider |
  | `sort: latency` | 17.5s, 13.7s | ~$0.012 | Together/BaseTen, final answer sometimes missed the cache |
  | `sort: throughput` | 13.3s, 13.6s | ~$0.011–0.020 | BaseTen for every round: fastest and most predictable |

  Chosen: `MODEL_PROVIDER_SORT=throughput` + `MODEL_SESSION_ROUTING=true` (backend `.env`). Cost is higher because the faster providers price input higher and miss the cache more often; shorter answers (the depth limit) bring it down. `llm_usage` logs `cached_tokens`, `cache_write_tokens` and `provider` per call.
- **Speed and communication, done 2026-10-25** (backend uncommitted):
  - Duplicate reads: `tools.Lookups` keeps what was asked and what code is shown (`ContextBuilder.shown_code`); a repeat gets `ALREADY_SHOWN` / `ALREADY_LOOKED_UP`, an overlapping read only reads the rest (`READ_ON_FROM`). Reads return up to 150 lines (`read_snippet(max_lines=…)`); a cut block says "from line N". Lookups share `MAX_LOOKUP_LINES` (1,600); when it's spent, looking stops (`lookup_room`). `llm_lookups` logs `repeats`.
  - Routing: `MODEL_PROVIDER_SORT`, `MODEL_PROVIDER_ORDER`, `MODEL_SESSION_ROUTING` (`llm.provider_routing`, `session_id` = conversation id).
  - Answer blocks (one mechanism, `app/query/grounding.py`; to add a block: a marker constant, a regex, a cap, a field on `GroundedAnswer` and `ChatMessage`, a prompt section, a component): `FOLLOW_UPS:` (≤4 "go deeper" questions, chips under the latest answer, `follow-ups.tsx`), `ASK:` (a question back with 2–4 options, never twice in a row via `may_ask`, `clarifying-question.tsx`), callouts `> [!NOTE|TIP|WARNING]` (≤2, `callout.tsx`, split client-side by `lib.answerBlocks`), tables only for comparisons, steps as before. All are cut from the streaming draft (`draftMarkdown`).
  - Prompt (`app/query/prompts/answer.md`): Tone (answer first, plain words, no filler, no closing question), Looking further (plan lookups up front), Depth (broad question → overview ≤ ~350 words + steps + follow-ups), Shaping the answer, Follow-ups, Asking back (only when the question really means two things here and nothing hints which; otherwise answer the likelier reading and say so).
  - Draft: one stage line ("Thinking…", "Looking things up (N)…", "Writing the answer…"), lookups fold into "Looked at N places", words fade in (`Markdown reveal`, Streamdown styles imported in `app/globals.css`, still under reduced motion).
  - Measured after: broad question 22s, 5 rounds, 15 lookups, 0 repeats, 6 steps + 4 follow-ups, ~$0.012 (BaseTen, cache reads from round 2).
  - Question back UI (2026-10-25): the options open as a panel over the chat input (`components/clarifying-question.tsx`, rendered in `chat/index.tsx`'s footer while the last message is an answer with `ask`), like a chat app's "which did you mean": numbered options (click or press 1–4), Escape or × skips it (`skipped` state), "Or type your own answer below". It takes focus when it opens. The answer itself keeps only the question line. Picking or typing sends the next question; the backend then adds `ANSWER_WITHOUT_ASKING` so the reply answers the chosen reading directly (no "assuming").
  - Starting a new conversation or opening another one ends a running walkthrough and clears the step it selected (`openConversation` in `chat/index.tsx`), so it isn't sent as "the selected node" with an unrelated question.
  - Lookups share `MAX_LOOKUP_LINES` = 1,600 (was 600: it ran out after two rounds and every later lookup came back empty, so the model said it "couldn't open" files).
  - Tested live 2026-10-25 (Team-MyPath/mypath-v3): broad question 17s, 69-word overview + 8 steps + 4 follow-ups, words fade in, stage line counts lookups; clicking a follow-up asks it (10s, Note callout appeared, chips only on the latest answer); "how does the form work?" → question back with two options, picking one answered it (12s); the input panel shows, takes focus, picks with "1", skips with Escape and survives a reload; a typed answer is answered directly. Whether the model asks back or states an assumption varies run to run for borderline questions (both are allowed by the prompt).
  - Known: a name sometimes shows twice when the model writes it next to its own chip (e.g. "createSocketClient createSocketClient"); a question back's lead-in can run longer than the prompt's "one sentence".
- **Parked: answer speed, later options** (decided 2026-10-24; 1–3 of the speed plan are being done: no duplicate reads, pinned provider + cache logging, answer at the right depth with "go deeper" follow-ups):
  - Low reasoning effort for lookup rounds, normal for the answer (needs a live check that the model honours it per call).
  - Prepared overviews at index time (per folder / main flow summaries, DeepWiki-style) so broad questions start from an overview; costs AI calls per index.
  - Answer cache per (repo, commit, question).
  - Trimming the first context (file map, module overview) to cut tokens per round.
  - Baseline measured before the work: a broad question took 44s, 5 lookup rounds (20 lookups, 5 of them repeats), ~$0.0066 over 6 calls, prompts 11k→20k tokens.
- **Parked: search by meaning (embeddings).** Decided 2026-10-24 to add later, only if A and C still miss code. Cursor measured +12.5% answer accuracy with semantic search on top of grep (cursor.com/blog/semsearch); Greptile embeds generated docstrings per node. Needs an embedding model, vector storage and a re-index per repo, so it needs dependency approval.
