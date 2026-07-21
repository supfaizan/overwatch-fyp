/* ============================================================
   OVERWATCH — Landing
   Operational Intelligence for Engineering Teams
   ============================================================ */

import Link from "next/link";

const NAV = ["Diagram", "Contracts", "Intelligence", "Architecture"];

const FEATURES = [
	{
		idx: "01",
		title: "Deterministic Architecture Diagram",
		tech: "Tree-sitter · React Flow",
		body: "Every import, call and HTTP edge resolved from the AST. Never guessed.",
		state: "signal",
		tag: "STRUCTURE",
	},
	{
		idx: "02",
		title: "Conversational Explorer",
		tech: "RAG over Neo4j",
		body: "“What depends on PaymentService?” — answered from the confirmed graph.",
		state: "signal",
		tag: "QUERY",
	},
	{
		idx: "03",
		title: "Ticket Intelligence",
		tech: "Sentence-BERT",
		body: "Jira and ClickUp tickets mapped to the services they actually touch.",
		state: "signal",
		tag: "CONTEXT",
	},
	{
		idx: "04",
		title: "Animated Flow Walkthrough",
		tech: "LLM flow reconstruction",
		body: "“Show me the login flow.” Replayed node by node, payload included.",
		state: "signal",
		tag: "REPLAY",
	},
	{
		idx: "05",
		title: "Logical Contract Checker",
		tech: "T-GNN + LLM reasoning",
		body: "Broken interface assumptions, caught on every merge to main.",
		state: "critical",
		tag: "FLAGSHIP",
	},
	{
		idx: "06",
		title: "Real-Time Incremental Updates",
		tech: "Webhooks · WebSocket",
		body: "Push fires a webhook. The diagram updates within seconds.",
		state: "warn",
		tag: "LIVE",
	},
];

const PIPELINE = [
	{ k: "INGEST", v: "GitHub · GitLab · Bitbucket webhooks", n: "01" },
	{ k: "PARSE", v: "Tree-sitter AST · dependency resolver", n: "02" },
	{ k: "GRAPH", v: "Neo4j · typed nodes & relationships", n: "03" },
	{ k: "REASON", v: "T-GNN co-change · grounded LLM", n: "04" },
	{ k: "RENDER", v: "React Flow · live WebSocket overlay", n: "05" },
];

const STATS = [
	{ v: "< 5s", k: "DIAGRAM UPDATE AFTER PUSH" },
	{ v: "90%", k: "T-GNN COUPLING CONFIDENCE" },
	{ v: "0", k: "HALLUCINATED EDGES" },
	{ v: "3", k: "GROUNDED AI LAYERS" },
];

function SectionLabel({ children }: { children: React.ReactNode }) {
	return (
		<div className="flex items-center gap-3">
			<span className="ow-live-dot" aria-hidden />
			<span className="ow-mono-micro text-text-lo">{children}</span>
			<span className="h-px flex-1 bg-line-1" aria-hidden />
		</div>
	);
}

/* Animated, layered architecture graph — FE / BE / Infra */
function GraphConsole() {
	return (
		<div className="relative overflow-hidden rounded-lg border border-line-1 bg-ink-900 shadow-[var(--ow-shadow-card)]">
			{/* console chrome */}
			<div className="flex items-center justify-between border-b border-line-1 bg-ink-850 px-4 py-2.5">
				<div className="flex items-center gap-2">
					<span className="ow-live-dot" aria-hidden />
					<span className="ow-mono-micro text-text-mid">
						repo: payments-core
					</span>
				</div>
				<span className="ow-mono-micro text-text-dim">GRAPH · LIVE</span>
			</div>

			<div className="relative">
				<div className="ow-scanline" aria-hidden />
				<svg
					viewBox="0 0 460 320"
					className="block w-full"
					role="img"
					aria-label="Live architecture graph"
				>
					{/* layer guides */}
					{[64, 160, 256].map((y, i) => (
						<g key={y}>
							<line
								x1="0"
								y1={y}
								x2="460"
								y2={y}
								stroke="var(--ow-line-1)"
								strokeDasharray="2 6"
							/>
							<text
								x="12"
								y={y - 8}
								className="ow-mono-micro"
								fill="var(--ow-text-dim)"
								fontSize="8"
							>
								{["FRONTEND", "BACKEND", "INFRA"][i]}
							</text>
						</g>
					))}

					{/* solid (high-confidence) edges with travelling signal */}
					{[
						"M120,64 L120,160",
						"M120,160 L240,256",
						"M300,64 L300,160",
						"M300,160 L240,256",
					].map((d, i) => (
						<g key={d}>
							<path
								d={d}
								fill="none"
								stroke="var(--ow-line-2)"
								strokeWidth="1.5"
							/>
							<path
								d={d}
								fill="none"
								stroke="var(--ow-signal)"
								strokeWidth="1.5"
								className="ow-edge-flow"
								style={{ animationDelay: `${i * 0.5}s` }}
							/>
						</g>
					))}

					{/* dashed (probabilistic / co-change) edge */}
					<path
						d="M120,160 C200,120 230,120 300,160"
						fill="none"
						stroke="var(--ow-stale)"
						strokeWidth="1.5"
						strokeDasharray="4 5"
						opacity="0.7"
					/>
					<text
						x="178"
						y="128"
						fontSize="7"
						className="ow-mono-micro"
						fill="var(--ow-stale)"
					>
						CO_CHANGES 47/52
					</text>

					{/* nodes */}
					{[
						{ x: 120, y: 64, label: "WebApp", layer: "fe" },
						{ x: 300, y: 64, label: "Dashboard", layer: "fe" },
						{ x: 120, y: 160, label: "PaymentSvc", layer: "be", hot: true },
						{ x: 300, y: 160, label: "StripeAdapter", layer: "be", hot: true },
						{ x: 240, y: 256, label: "Neo4j", layer: "infra" },
					].map((nd) => (
						<g key={nd.label}>
							{nd.hot && (
								<circle
									cx={nd.x}
									cy={nd.y}
									r="16"
									fill="var(--ow-critical-soft)"
									className="ow-node-pulse"
									style={{
										animation: "ow-node-glow 2.4s ease-in-out infinite",
									}}
								/>
							)}
							<rect
								x={nd.x - 44}
								y={nd.y - 13}
								width="88"
								height="26"
								rx="4"
								fill="var(--ow-surface-2)"
								stroke={
									nd.hot ? "var(--ow-critical-border)" : "var(--ow-line-2)"
								}
								strokeWidth="1"
							/>
							<circle
								cx={nd.x - 32}
								cy={nd.y}
								r="3"
								fill={nd.hot ? "var(--ow-critical)" : "var(--ow-signal)"}
							/>
							<text
								x={nd.x - 23}
								y={nd.y + 3.5}
								fontSize="9"
								fontFamily="var(--ow-font-mono)"
								fill="var(--ow-text-hi)"
							>
								{nd.label}
							</text>
						</g>
					))}
				</svg>

				{/* floating contract warning chip */}
				<div className="absolute bottom-4 right-4 max-w-[230px] rounded-md border border-critical-border bg-critical-soft px-3 py-2 backdrop-blur-sm">
					<div className="ow-mono-micro text-critical">
						⚠ CONTRACT MISMATCH · CRITICAL
					</div>
					<div className="mt-1 ow-mono-data text-text-mid">
						StripeAdapter assumes timeout 3000ms — caller now sends 5000ms.
					</div>
				</div>
			</div>
		</div>
	);
}

export function Landing() {
	return (
		<div className="relative min-h-full overflow-x-hidden bg-ink-850 text-text-hi">
			{/* ambient background grid */}
			<div
				className="ow-grid pointer-events-none absolute inset-x-0 top-0 h-[760px]"
				aria-hidden
			/>

			{/* ---- Top status bar ---- */}
			<header className="sticky top-0 z-30 border-b border-line-1 bg-ink-900/85 backdrop-blur-md">
				<div className="relative mx-auto max-w-[1500px] flex h-14 items-center justify-between px-12">
					<div className="flex items-center gap-2.5">
						<span className="ow-live-dot" aria-hidden />
						<span className="ow-label text-text-hi !text-[13px]">
							OVERWATCH
						</span>
					</div>
					<nav className="hidden items-center gap-7 md:flex">
						{NAV.map((n) => (
							<a
								key={n}
								href={`#${n.toLowerCase()}`}
								className="ow-mono-micro text-text-lo transition-colors hover:text-signal"
							>
								{n}
							</a>
						))}
					</nav>
					<div className="flex items-center gap-4">
						<Link
							href="/login"
							className="hidden ow-mono-micro text-text-lo transition-colors hover:text-text-hi sm:inline"
						>
							SIGN IN
						</Link>
						<Link
							href="/register"
							className="rounded-sm border border-signal-border bg-signal-soft px-3.5 py-1.5 ow-mono-micro text-signal transition-colors hover:bg-signal hover:text-signal-ink"
						>
							GET STARTED
						</Link>
					</div>
				</div>
			</header>

			{/* ---- Hero ---- */}
			<section className="relative mx-auto max-w-[1500px] px-12 pb-20 pt-16 md:pt-24">
				<div className="grid items-center gap-12 lg:grid-cols-[1.05fr_1fr] lg:gap-24">
					{/* left: copy */}
					<div>
						<div className="ow-rise inline-flex items-center gap-2 rounded-pill border border-line-2 bg-surface-1 px-3 py-1.5">
							<span className="ow-live-dot" aria-hidden />
							<span className="ow-mono-micro text-text-mid">
								SYSTEM KNOWLEDGE · NO LONGER TRIBAL
							</span>
						</div>

						<h1
							className="ow-rise ow-display mt-6 text-text-hi !text-[44px] leading-[1.04] sm:!text-[58px]"
							style={{ animationDelay: "0.08s" }}
						>
							Your system,
							<br />
							<span className="text-signal">watched</span> in real time.
						</h1>

						<p
							className="ow-rise ow-body mt-6 max-w-xl text-text-mid"
							style={{ animationDelay: "0.16s" }}
						>
							A deterministic architecture diagram that updates seconds after a
							push — and AI that flags broken contracts{" "}
							<span className="text-text-hi">before they become incidents</span>
							.
						</p>

						<div
							className="ow-rise mt-8 flex flex-wrap items-center gap-3"
							style={{ animationDelay: "0.24s" }}
						>
							<Link
								href="/register"
								className="group inline-flex items-center gap-2 rounded-md bg-signal px-5 py-3 ow-label !text-[12px] text-signal-ink transition-transform hover:-translate-y-0.5"
							>
								CONNECT A REPOSITORY
								<span className="transition-transform group-hover:translate-x-1">
									→
								</span>
							</Link>
							<a
								href="#diagram"
								className="inline-flex items-center gap-2 rounded-md border border-line-2 bg-surface-1 px-5 py-3 ow-label !text-[12px] text-text-mid transition-colors hover:border-signal-border hover:text-text-hi"
							>
								VIEW THE CONSOLE
							</a>
						</div>

						{/* stat strip */}
						<div
							className="ow-rise mt-12 grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-line-1 bg-line-1 sm:grid-cols-4"
							style={{ animationDelay: "0.32s" }}
						>
							{STATS.map((s) => (
								<div key={s.k} className="bg-ink-800 px-4 py-4">
									<div className="ow-mono-data !text-[20px] text-signal">
										{s.v}
									</div>
									<div className="mt-1 ow-mono-micro text-text-dim leading-[1.4]">
										{s.k}
									</div>
								</div>
							))}
						</div>
					</div>

					{/* right: live graph */}
					<div className="ow-rise" style={{ animationDelay: "0.2s" }}>
						<GraphConsole />
					</div>
				</div>
			</section>

			{/* ---- Problem marquee ---- */}
			<section className="border-y border-line-1 bg-ink-900 py-4">
				<div className="flex items-center gap-3 overflow-hidden">
					<span className="ml-3 shrink-0 ow-mono-micro text-text-dim">
						THE GAP NOBODY FILLED //
					</span>
					<div className="relative flex-1 overflow-hidden">
						<div
							className="flex w-max gap-8 whitespace-nowrap"
							style={{ animation: "ow-marquee 28s linear infinite" }}
						>
							{[...Array(2)].map((_, dup) => (
								<div className="flex gap-8" key={dup} aria-hidden={dup === 1}>
									{[
										"Static diagrams · no live updates",
										"Issue trackers · no code structure",
										"Copilot · no system awareness",
										"Confluence · nobody maintains it",
									].map((t) => (
										<span key={t} className="ow-mono-data text-text-lo">
											<span className="text-critical">✕</span> {t}
										</span>
									))}
								</div>
							))}
						</div>
					</div>
				</div>
			</section>

			{/* ---- Features ---- */}
			<section id="diagram" className="mx-auto max-w-[1500px] px-12 py-24">
				<SectionLabel>CAPABILITIES // 06</SectionLabel>
				<h2 className="ow-heading mt-5 max-w-2xl text-text-hi">
					One operational view. Confirmed structure, intelligent prediction.
				</h2>

				<div className="mt-12 grid gap-px overflow-hidden rounded-lg border border-line-1 bg-line-1 md:grid-cols-2 lg:grid-cols-3">
					{FEATURES.map((f) => {
						const accent =
							f.state === "critical"
								? "text-critical"
								: f.state === "warn"
									? "text-warn"
									: "text-signal";
						const tagBox =
							f.state === "critical"
								? "border-critical-border bg-critical-soft text-critical"
								: f.state === "warn"
									? "border-warn-border bg-warn-soft text-warn"
									: "border-signal-border bg-signal-soft text-signal";
						return (
							<article
								key={f.idx}
								className="ow-panel group relative !rounded-none p-6"
							>
								<div className="flex items-start justify-between">
									<span className={`ow-mono-data !text-[22px] ${accent}`}>
										{f.idx}
									</span>
									<span
										className={`rounded-sm border px-2 py-0.5 ow-mono-micro ${tagBox}`}
									>
										{f.tag}
									</span>
								</div>
								<h3 className="mt-5 ow-body !text-[16px] font-semibold text-text-hi">
									{f.title}
								</h3>
								<p className="mt-2 ow-body !text-[13.5px] text-text-mid">
									{f.body}
								</p>
								<div className="mt-5 flex items-center gap-2 border-t border-line-1 pt-3">
									<span className="ow-mono-micro text-text-dim">{f.tech}</span>
								</div>
							</article>
						);
					})}
				</div>
			</section>

			{/* ---- Flagship: Contract Checker terminal ---- */}
			<section id="contracts" className="border-t border-line-1 bg-ink-900">
				<div className="mx-auto max-w-[1500px] grid gap-12 px-12 py-24 lg:grid-cols-[1fr_1.1fr] lg:items-center lg:gap-24">
					<div>
						<SectionLabel>FLAGSHIP // CONTRACT CHECKER</SectionLabel>
						<h2 className="ow-heading mt-5 text-text-hi">
							The “how did it catch that” moment.
						</h2>
						<p className="ow-body mt-4 max-w-lg text-text-mid">
							A T-GNN trained on your commit history finds files that break
							together — even with no import between them. The LLM then reads
							the diff and checks for logical mismatches.
						</p>
						<ul className="mt-6 space-y-3">
							{[
								"Payload shape changes",
								"Parameter count differences",
								"Broken interface assumptions",
								"Inconsistent shared configs",
							].map((c) => (
								<li
									key={c}
									className="flex items-center gap-3 ow-body !text-[14px] text-text-mid"
								>
									<span
										className="h-1.5 w-1.5 rounded-sm bg-warn"
										aria-hidden
									/>
									{c}
								</li>
							))}
						</ul>
					</div>

					{/* terminal output */}
					<div className="overflow-hidden rounded-lg border border-line-1 bg-ink-850 shadow-[var(--ow-shadow-card)]">
						<div className="flex items-center justify-between border-b border-line-1 bg-ink-800 px-4 py-2.5">
							<span className="ow-mono-micro text-text-lo">
								overwatch · side-panel
							</span>
							<span className="ow-mono-micro text-critical">
								PRIORITY: CRITICAL
							</span>
						</div>
						<div className="space-y-3 p-5 ow-mono-data leading-relaxed">
							<p className="text-critical">⚠ CONTRACT MISMATCH</p>
							<p className="text-text-mid">
								<span className="text-text-hi">PaymentController.ts</span> now
								sends <span className="text-warn">timeout: 5000ms</span>
							</p>
							<p className="text-text-mid">
								<span className="text-text-hi">StripeAdapter.ts</span>:47
								assumes max <span className="text-warn">timeout: 3000ms</span>
							</p>
							<p className="rounded-sm border border-critical-border bg-critical-soft p-3 text-text-mid">
								<span className="text-critical">RISK</span> — StripeAdapter may
								retry after PaymentController has already timed out → potential
								duplicate charge attempts.
							</p>

							{/* confidence bar */}
							<div className="pt-1">
								<div className="flex items-center justify-between ow-mono-micro text-text-lo">
									<span>T-GNN COUPLING CONFIDENCE</span>
									<span className="text-signal">90%</span>
								</div>
								<div className="mt-2 h-1.5 w-full overflow-hidden rounded-pill bg-surface-3">
									<div
										className="h-full origin-left rounded-pill bg-signal"
										style={{
											width: "90%",
											animation:
												"ow-bar 1.4s cubic-bezier(0.16,1,0.3,1) forwards",
										}}
									/>
								</div>
							</div>

							<p className="text-text-lo">
								<span className="text-signal">›</span> suggested: review
								StripeAdapter retry logic
								<span className="ow-cursor ml-1" aria-hidden />
							</p>
						</div>
					</div>
				</div>
			</section>

			{/* ---- Pipeline / Architecture ---- */}
			<section id="architecture" className="mx-auto max-w-[1500px] px-12 py-24">
				<SectionLabel>SYSTEM // INGEST → RENDER</SectionLabel>
				<h2 className="ow-heading mt-5 max-w-2xl text-text-hi">
					Five deterministic stages. The AI layers sit on top of confirmed
					truth.
				</h2>

				<div className="mt-12 grid gap-px overflow-hidden rounded-lg border border-line-1 bg-line-1 md:grid-cols-5">
					{PIPELINE.map((p, i) => (
						<div
							key={p.k}
							className="group relative bg-ink-800 p-5 transition-colors hover:bg-surface-2"
						>
							<div className="flex items-center justify-between">
								<span className="ow-mono-micro text-text-dim">{p.n}</span>
								{i < PIPELINE.length - 1 && (
									<span
										className="text-signal opacity-50 transition-opacity group-hover:opacity-100"
										aria-hidden
									>
										→
									</span>
								)}
							</div>
							<div className="mt-4 ow-label !text-[12px] text-signal">
								{p.k}
							</div>
							<p className="mt-2 ow-mono-data !text-[11px] text-text-mid leading-snug">
								{p.v}
							</p>
						</div>
					))}
				</div>

				{/* confidence legend */}
				<div className="mt-8 flex flex-wrap items-center gap-x-8 gap-y-4 rounded-lg border border-line-1 bg-surface-1 px-6 py-5">
					<span className="ow-mono-micro text-text-dim">
						CONFIDENCE LEGEND //
					</span>
					<span className="flex items-center gap-2.5 ow-mono-micro text-text-mid">
						<svg width="34" height="6" aria-hidden>
							<line
								x1="0"
								y1="3"
								x2="34"
								y2="3"
								stroke="var(--ow-signal)"
								strokeWidth="2"
							/>
						</svg>
						SOLID · HIGH CONFIDENCE
					</span>
					<span className="flex items-center gap-2.5 ow-mono-micro text-text-mid">
						<svg width="34" height="6" aria-hidden>
							<line
								x1="0"
								y1="3"
								x2="34"
								y2="3"
								stroke="var(--ow-stale)"
								strokeWidth="2"
								strokeDasharray="4 4"
							/>
						</svg>
						DASHED · PROBABILISTIC
					</span>
					<span className="flex items-center gap-2 ow-mono-micro text-critical">
						<span className="h-2 w-2 rounded-sm bg-critical" /> CRITICAL
					</span>
				</div>
			</section>

			{/* ---- CTA ---- */}
			<section id="connect" className="border-t border-line-1 bg-ink-900">
				<div className="relative mx-auto max-w-[1500px] px-12 py-24">
					<div className="ow-scanline" aria-hidden />
					<div className="relative mx-auto max-w-2xl text-center">
						<h2 className="ow-display mt-6 text-text-hi !text-[40px] leading-[1.05] sm:!text-[52px]">
							Point it at a repo.
							<br />
							Watch the system <span className="text-signal">come alive</span>.
						</h2>
						<p className="ow-body mt-5 text-text-mid">
							Full index on connect. Incremental on every push.
						</p>
						<div className="mt-9 flex flex-wrap items-center justify-center gap-3">
							<Link
								href="/register"
								className="inline-flex items-center gap-2 rounded-md bg-signal px-6 py-3.5 ow-label !text-[12px] text-signal-ink transition-transform hover:-translate-y-0.5"
							>
								CONNECT A REPOSITORY →
							</Link>
							<Link
								href="/login"
								className="inline-flex items-center gap-2 rounded-md border border-line-2 bg-surface-1 px-6 py-3.5 ow-label !text-[12px] text-text-mid transition-colors hover:border-signal-border hover:text-text-hi"
							>
								SIGN IN
							</Link>
						</div>
					</div>
				</div>
			</section>

			{/* ---- Footer ---- */}
			<footer className="border-t border-line-1 bg-ink-850">
				<div className="mx-auto max-w-[1500px] flex flex-col items-start justify-between gap-4 px-12 py-8 sm:flex-row sm:items-center">
					<div className="flex items-center gap-2.5">
						<span className="ow-live-dot" aria-hidden />
						<span className="ow-label !text-[12px] text-text-hi">
							OVERWATCH
						</span>
						<span className="ow-mono-micro text-text-dim">{"// OPINT"}</span>
					</div>
					<p className="ow-mono-micro text-text-dim">
						FYP · UMT LAHORE 2026
					</p>
				</div>
			</footer>
		</div>
	);
}
