# Coding Agent Instructions

## Operating Principles

- Keep it simple. Make the smallest maintainable change that solves the actual request.
- Assume the user is a principal engineer. Be concise; correct mistaken assumptions respectfully with evidence.
- Prefer existing patterns and libraries over new abstractions. Avoid broad refactors, speculative helpers, and clever architecture without clear justification.
- Aim for production-quality code: clear naming, strong types, simple control flow, minimal mutation, focused functions, and pure functions/components where practical.
- Apply SOLID and DRY pragmatically, not as reasons to add indirection. Avoid single-use abstractions and wrappers that only call another function; prefer direct logic and inline types when clearer.
- Optimize for correctness, speed, judgment, and token efficiency. Inspect enough surrounding code to understand the pattern, then stop exploring.

## Project and Architecture

This project uses Next.js 16 App Router, React 19, strict TypeScript, Tailwind CSS v4, and pnpm. The `@/*` alias resolves to the project root; there is no `src/` directory.

Follow feature-based ownership:

| Location | Responsibility |
| --- | --- |
| `app/` | Next.js routes, layouts, route handlers, and composition of feature entry points. Keep pages thin. |
| `features/<feature>/` | Code owned by that feature: its UI, API calls, hooks, state, types, schemas, and utilities. |
| `shared/` | Reusable code used by two or more features, including shared UI and infrastructure. |
| `app/globals.css` | Global styles and centralized design tokens. |
| `proxy.ts` | Request-level routing/redirect policy; not feature business logic. |

- Keep single-feature code inside its feature, even if it could hypothetically be reused. Promote it to `shared/` when two or more features actually need it.
- Existing shared UI belongs in `shared/components/`. Add other shared folders only when needed; do not create empty scaffolding.
- Before building UI, check `shared/components/` for an existing component; each file's JSDoc documents its purpose, props and best practices (rendered at `/docs/ui` in dev). When adding or changing a shared component, document it with JSDoc (component summary, `- ` bullet best practices, `/** */` + `@default` on each prop) and add examples in `features/ui-docs/examples/<file>.tsx`, registered in `features/ui-docs/examples/index.ts`.
- Use a feature's root `index.tsx` as its UI entry point, matching `features/waitlist/index.tsx`. Keep feature-owned components in `components/`, API calls in `api.ts`, and other files/folders beside them as needed.
- Do not import another feature's internals. Compose features in `app/`; extract genuinely shared code to `shared/` instead of introducing cross-feature dependencies.
- Dependency direction is `app → features → shared`; `app` may also import `shared`. Shared code must not import features or routes, and features must not import `app/` code. Global CSS is applied by the root layout.
- Separate API/data-access logic from presentation. Use feature `api.ts` files for feature-specific requests; share transport infrastructure only when genuinely reused.
- Export only what consumers need. Avoid barrel exports that mix server-only and client code.
- Match nearby naming and formatting. Do not restructure existing code merely to enforce these conventions during unrelated work.

## Next.js and Type Safety

- Default to Server Components. Add `'use client'` only where browser APIs, interactive state, or client hooks require it; keep the client boundary narrow.
- Keep credentials, secrets, and privileged data access server-only. Never expose them through client imports or `NEXT_PUBLIC_*` variables. Mark sensitive server modules with `server-only` when appropriate.
- Enforce authentication and authorization on the server where protected data is read or changed. UI hiding and proxy redirects are not sufficient authorization.
- Route groups such as `(public)` organize routes without changing URLs or providing access control. Avoid multiple pages resolving to the same URL.
- Use strict, explicit types at boundaries. Avoid `any` and unjustified casts or non-null assertions; narrow `unknown` and validate untrusted input using existing tooling.
- Handle expected failures explicitly; do not silently swallow errors. Preserve accessible semantics, labels, keyboard behavior, and focus states in UI.
- Reuse established data-fetching and state patterns. An installed library is not a reason to introduce it into an unrelated feature.

## Styling and Design System

- Tailwind utilities are the primary styling approach. Keep reusable design tokens centralized in `app/globals.css` using Tailwind v4 `@theme`.
- Prefer semantic names such as `background`, `surface`, `foreground`, `primary`, and `border` over component-specific names or repeated raw colors.
- The existing background token is `--color-background: #f3f4f0`; use `bg-background` rather than repeating the hex value.
- Use ordinary CSS variables for values that do not need utilities. If theme values reference runtime CSS variables, use `@theme inline`; add theme switching only when requested.
- Reuse shared components for repeated UI patterns. Keep feature-specific styling and components within their feature.
- Avoid new global selectors, arbitrary values, CSS files, or styling abstractions unless existing utilities and tokens do not fit. Preserve existing global typography.

## Workflow and Code Changes

1. Read relevant instructions, affected code, and nearby call sites before proposing changes.
2. Present a plan proportionate to risk and wait for explicit approval before editing. State focused assumptions or ask questions when behavior or compatibility is ambiguous.
3. Implement only the approved scope using precise edits. Re-read affected files before editing, preserve unrelated user changes, and stop if material differences invalidate the plan.
4. Review the result and use validation proportionate to risk. Report limitations honestly.

- Do not add unrelated cleanup, files, helpers, wrappers, maps, abstractions, or validation layers unless they clearly reduce complexity within the request.
- Do not install dependencies, change tooling, or introduce a new test library without justification and approval.
- Never run Git write operations, including add, commit, push, reset, or checkout, unless explicitly authorized in the current user message.
- Do not delete or overwrite user work. Ask before destructive operations or changes to remote systems.

## Context Discipline and Command Output

- Answer the narrow question first. Inspect the smallest relevant file, symbol, route, component, diff, log, or test output.
- Prefer targeted searches, focused file sections, nearby call sites, and scoped validation. Scope paths before printing content; list files or count matches when useful.
- Avoid full-file dumps after relevant code is found, unrelated directories, broad repository searches, large diffs, and generated output. Exclude dependencies and generated, binary, minified, database, or huge JSON/JSONL files unless required.
- Read relevant instruction files, skill files, tool documentation, and agent policies completely; do not byte-cap them. If unexpectedly huge, read them in chunks rather than silently truncating.
- Any command with unknown or potentially large output must be scoped and byte-capped. Line caps alone are insufficient because one line may be huge.
- Use the configured RTK skill for supported shell commands when available, while retaining scoping and byte caps for unknown or potentially large output. Use file-reading tools for exact code inspection.

Examples (adapt paths to this root-level project):

```bash
rg -n -m 20 'ComponentName|functionName' features/waitlist 2>&1 | head -c 4000
git diff -- app/globals.css 2>&1 | head -c 4000
```

These capped pipelines are for inspection, not proof that a validation command succeeded. For validation, preserve the command's exit status and cap only the displayed output:

```bash
tmp="$(mktemp)"
pnpm exec oxlint app/layout.tsx >"$tmp" 2>&1
status=$?
tail -c 4000 "$tmp"
rm -f "$tmp"
exit "$status"
```

- Avoid unbounded `cat`, broad `rg`, `find`, `ls -R`, `git diff`, test/build output, and database `select *`.
- If capped output is insufficient, narrow the command before increasing the cap. Do not mistake truncated output for complete evidence.

## Validation

- Match validation to risk. For low-risk documentation-only changes, skip executable validation and say so; review the text for accuracy.
- Use the cheapest useful check first: a focused test, lint on changed files, or type checking when types are affected. Do not run full suites, full lint, or builds unless risk justifies them or the user asks.
- Use pnpm and the existing tooling: `pnpm dev`, `pnpm lint` (Oxlint), `pnpm test` (Vitest), and `pnpm build` (Next.js).
- Scoped examples: `pnpm exec oxlint <changed-files>` and `pnpm exec vitest run <test-file>`. For project-wide type checking when justified, use `pnpm exec tsc --noEmit --incremental false`. Cap potentially large output without masking failures.
- When existing tests cover changed behavior, update or add focused cases using that test setup. If no tests cover the area and tests were not requested, do not introduce them without approval.
- Never claim a check passed unless it ran successfully. Distinguish failures caused by the change from pre-existing issues and report unverified behavior.

## Subagents

- Use subagents only when they save context/time or materially improve quality; avoid delegation for trivial work.
- Prefer narrow delegation for documentation/API checks, research, and non-trivial content generation when useful.
- Do not prime research or review with a preferred conclusion. Require evidence, tradeoffs, uncertainty, and better alternatives where relevant.
- Ask each subagent for findings, files inspected, files changed (if any), validation run (if any), and risks or uncertainty.
- The main agent owns final judgment and integration.

## Communication

- Keep verbosity low. During complex work, give brief updates on findings, changes, and remaining risk.
- After work, summarize what changed, paths touched, validation run or why skipped, and any remaining risk.
- Do not explain obvious edits or restate information the user already provided.
