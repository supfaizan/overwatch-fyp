# Overwatch — Project Reference

> **Internal codename:** OpInt (Operational Intelligence)
> **Full name:** Overwatch — Operational Intelligence for Engineering Teams
> **Type:** Final Year Project (FYP) — University of Management & Technology, Lahore
> **Status:** In development (started March 2026)
> **Classification:** Confidential

---

## 1. Problem Statement
Every engineering team above ~10 people suffers from the same invisible failure: **system knowledge is tribal**. It lives in the heads of senior engineers, in Slack threads that scroll away, and in Confluence pages nobody maintains.

When something breaks in production, engineers are simultaneously:

- Grepping git history
- Searching Jira
- Asking colleagues

...because no single tool shows how the system actually works _right now_.

### Existing tools and their gaps

| Tool                 | What it does               | What it misses                                           |
| -------------------- | -------------------------- | -------------------------------------------------------- |
| CodeBoarding / Swimm | Static diagrams from code  | No ticket awareness, no live updates, no risk prediction |
| Jira / ClickUp       | Issue tracking             | No connection to actual code structure                   |
| Datadog / Dynatrace  | Runtime observability      | Requires instrumentation, no code understanding          |
| GitHub Copilot       | File-level code assistance | No system-level awareness                                |

**The gap nobody has filled:** a system that combines live code understanding, ticket context, historical change patterns, and AI reasoning into a single operational view — updated automatically, queryable in plain English, and proactively flagging risks before they become incidents.

---

## 2. Solution — What Overwatch Is

Overwatch is a **living system intelligence platform**. It:

1. Connects to a team's Git repository and issue tracker
2. Parses the codebase using static analysis (Tree-sitter)
3. Renders an interactive architecture diagram that updates in real time as code changes
4. Links every service node to its active tickets
5. Triggers AI-powered risk analysis on every push
6. Answers developer queries in plain English, grounded in the actual system

### Core design principle

> **Deterministic static analysis handles structure. AI handles prediction, explanation, and reasoning.**

The diagram is always architecturally correct. The AI layer adds intelligence on top of confirmed truth — it never substitutes for it.

---

## 3. Features

### 3.1 Deterministic Architecture Diagram

- Tree-sitter parses the repo into an AST
- Dependency resolver maps all imports, calls, and HTTP connections
- LLM labels nodes and edges in plain English
- React Flow renders a layered, interactive diagram
- Layers: Frontend → Backend → Infrastructure
- Updates within seconds of a push via webhooks (only changed files re-parsed)

**AI technique:** Tree-sitter (deterministic) + LLM labelling  
**Confidence:** Solid edges = high confidence. Dashed edges = probabilistic.

---

### 3.2 Conversational Explorer

- Developer asks natural language questions: _"What depends on PaymentService?"_
- AI answers using the confirmed graph as grounded context
- Relevant nodes highlight live on the diagram in response
- No hallucinated structure — LLM only reasons over confirmed graph data

**AI technique:** RAG over graph DB (Neo4j)

---

### 3.3 Ticket Intelligence

- Jira / ClickUp tickets mapped to affected services via semantic embeddings
- Clicking a ticket highlights impacted nodes on the diagram with a confidence score
- Fine-tuned on team's own historical ticket-to-PR mappings (self-improving)
- Updates in real time as new tickets are created

**AI technique:** BERT embeddings + semantic similarity (Sentence-BERT)

---

### 3.4 Animated Flow Walkthrough

- Developer asks: _"Show me the login flow"_
- LLM reconstructs the execution path from the static graph
- Generates a step-by-step animation with payload narration at each node
- Bounded context — operates on subgraph only, not the full repo

**AI technique:** LLM flow reconstruction over graph

---

### 3.5 Logical Contract Checker ⚡ (Flagship Feature)

The feature that produces the _"how did it catch that"_ reaction.

Runs automatically as a background daemon after every push to `main`.

**Flow:**

1. PR merged → webhook fires
2. T-GNN runs forward pass → identifies files historically coupled to what changed (with probability scores)
3. LLM receives: the PR diff + T-GNN flagged files only (bounded context)
4. LLM checks for logical mismatches:
   - Payload shape changes
   - Parameter count differences
   - Broken interface assumptions
   - Inconsistent shared configs
5. Structured warning posted to Overwatch side panel with confidence score and suggested action

**Example output:**

```
⚠  CONTRACT MISMATCH — Priority: Critical
PaymentController.ts now sends timeout: 5000ms
StripeAdapter.ts line 47 assumes max timeout: 3000ms
Risk: StripeAdapter may retry after PaymentController has already timed
      out — potential duplicate charge attempts.

T-GNN coupling confidence: 90%
Suggested: review StripeAdapter retry logic
```

**AI technique:** T-GNN (co-change prediction) + LLM semantic reasoning  
**Priority levels:** Critical / Warning / Informational

---

### 3.6 Real-Time Incremental Updates

- GitHub / GitLab / Bitbucket webhooks fire on every push
- Only changed files are re-parsed (not the full repo)
- Diagram updates within seconds
- Tickets re-map on creation
- WebSocket pushes updates to the frontend live

---

### 3.7 Multi-Repo Support

- Backend, Frontend, Lambda repos indexed independently
- Cross-repo connections inferred from API endpoint matching and shared type definitions
- Scoped to REST — well-defined inference rules, no hallucination

---

### 3.8 Confidence Scoring

Every AI output carries a visible confidence score:

- Solid edges = high confidence
- Dashed edges = probabilistic
- Contract warnings show priority level: Critical / Warning / Informational

---

## 4. AI Components (FYP Rubric — 3 Required)

### Feature 1 — Deep Learning: T-GNN (Temporal Graph Neural Network)

**What it does:**  
Predicts the blast radius of any code change — which files are likely to break together — based on years of git commit co-change history, even when no import relationship exists between files.

**Why it's needed:**  
Static analysis only sees explicit relationships (imports, calls). The T-GNN sees _implicit_ relationships — e.g. two files that have appeared in the same commit 47 out of 52 times over 3 years. This is a strong signal of logical coupling that AST analysis is blind to.

**Architecture:**

- Input: git log metadata (commit hash, timestamp, file paths)
- Model: Temporal Graph Network (Rossi et al., NeurIPS 2020)
- Temporal component: LSTM weights recent patterns more heavily than old ones (a decoupled refactor 3 months ago is reflected in predictions)
- Output: per-file probability scores written back to Neo4j

**Training data:**

- Only requires: `git log --name-only --pretty=format:'%H %at'`
- Cold start: pre-train on large open source repos (NestJS, Django, Rails)
- Fine-tune on target repo from first commit onward
- No proprietary data, no production incident logs required

**Implementation:** PyTorch Geometric (TGN implementation available)

**Academic foundation:**

- Zimmermann et al. (2005) — _Mining Version Histories to Guide Software Changes_ — MSR
- Kagdi et al. (2007) — _A Survey and Taxonomy of Approaches for Mining Software Repositories_
- Rossi et al. (2020) — _Temporal Graph Networks for Deep Learning on Dynamic Graphs_ — NeurIPS

---

### Feature 2 — ML / NLP: BERT Semantic Embeddings

**What it does:**  
Maps Jira/ClickUp ticket descriptions to affected services and code paths using semantic similarity.

**Architecture:**

- Model: Sentence-BERT
- Fine-tuned on team's historical ticket-to-PR mappings (labelled training set)
- Continuously improves as more tickets accumulate

**Output:** Ticket nodes in graph linked to service nodes with confidence scores

---

### Feature 3 — Generative AI + Grounded Reasoning: LLM Layer

**Three distinct functions:**

| Function            | Input                         | Output                                                  |
| ------------------- | ----------------------------- | ------------------------------------------------------- |
| Node/edge labelling | Confirmed AST structure       | Plain English labels for services, modules, connections |
| Flow reconstruction | Subgraph + developer query    | Step-by-step animation script                           |
| Contract checking   | PR diff + T-GNN flagged files | Structured warning with priority score                  |

**Key constraint:** LLM always grounded in confirmed graph — it reasons, never infers structure.

**Model:** Claude / GPT-4o via API (configurable)

---

## 5. System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     INGESTION LAYER                      │
│  GitHub / GitLab / Bitbucket webhooks                   │
│  Full index on first connect. Incremental on every push │
│  Jira / ClickUp webhook for ticket events               │
└─────────────────────┬───────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────┐
│                     PARSING LAYER                        │
│  Tree-sitter AST parsing (TypeScript, Python, Go)       │
│  Dependency resolver: imports, exports, HTTP calls,     │
│  DB connections — all deterministic                     │
└─────────────────────┬───────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────┐
│                     GRAPH DATABASE                       │
│  Neo4j Community Edition                                │
│  Nodes: Service, Module, Function, Ticket, Developer    │
│  Edges: typed relationships (imports, calls, owns, etc) │
│  Persistent memory for all AI layers                    │
└──────────┬──────────────────────────┬───────────────────┘
           │                          │
┌──────────▼──────────┐   ┌───────────▼───────────────────┐
│     T-GNN LAYER     │   │          LLM LAYER             │
│  PyTorch Geometric  │   │  Claude / GPT-4o via API       │
│  Trained on git log │   │  Node labelling                │
│  co-change history  │   │  Flow reconstruction           │
│  Runs on every push │   │  Contract checking             │
│  Writes scores back │   │  Conversational queries        │
│  to Neo4j           │   │  Always grounded in graph      │
└──────────┬──────────┘   └───────────┬───────────────────┘
           │                          │
┌──────────▼──────────────────────────▼───────────────────┐
│                      FRONTEND                            │
│  React + React Flow                                     │
│  Layered diagram: FE / BE / Infra                       │
│  Real-time updates via WebSocket                        │
│  Ticket badges on nodes                                 │
│  Heatmap overlay (T-GNN risk scores)                    │
│  Animated flow player                                   │
│  Side panel: contract warnings + ticket details         │
└─────────────────────────────────────────────────────────┘
```

---

## 6. Tech Stack

| Layer            | Technology                                       |
| ---------------- | ------------------------------------------------ |
| Backend API      | TypeScript / NestJS                              |
| Graph Database   | Neo4j Community Edition                          |
| Code Parsing     | Tree-sitter (Node.js bindings via npm)           |
| ML / DL          | Python, PyTorch Geometric (T-GNN), Sentence-BERT |
| LLM              | Claude API / GPT-4o API (configurable)           |
| Frontend         | React, React Flow, TailwindCSS                   |
| Real-time        | WebSockets                                       |
| Webhooks         | GitHub / GitLab / Bitbucket, Jira / ClickUp      |
| Containerization | Docker                                           |
| Primary language | TypeScript (extensible to Python, Go)            |

---

## 7. Data Models (Neo4j Graph Schema)

### Node types

| Node         | Key properties                                       |
| ------------ | ---------------------------------------------------- |
| `Repository` | id, name, url, provider (github/gitlab), lastIndexed |
| `Service`    | id, name, language, path, layer (FE/BE/Infra)        |
| `Module`     | id, name, filePath, serviceId                        |
| `Function`   | id, name, moduleId, signature                        |
| `Ticket`     | id, externalId, title, description, status, provider |
| `Developer`  | id, name, email, githubHandle                        |
| `Commit`     | id, hash, timestamp, authorId                        |

### Edge types

| Edge              | From → To           | Properties                     |
| ----------------- | ------------------- | ------------------------------ |
| `IMPORTS`         | Module → Module     | confidence                     |
| `CALLS`           | Function → Function | callType (http/direct)         |
| `CONNECTS_TO`     | Service → Service   | protocol                       |
| `AFFECTS`         | Ticket → Service    | confidence (BERT score)        |
| `AUTHORED`        | Developer → Commit  |                                |
| `CHANGED`         | Commit → Module     |                                |
| `CO_CHANGES_WITH` | Module → Module     | frequency, tgnnScore, lastSeen |

---

## 8. API Endpoints (NestJS)

### Repository

```
POST   /api/repos/connect          Connect a new repo
GET    /api/repos/:id/graph        Get full graph for a repo
GET    /api/repos/:id/status       Indexing status
POST   /api/repos/:id/reindex      Force full reindex
```

### Graph

```
GET    /api/graph/:repoId          Full graph data (nodes + edges)
GET    /api/graph/:repoId/node/:id Single node with neighbours
POST   /api/graph/query            Natural language query → subgraph
```

### Tickets

```
POST   /api/tickets/webhook        Jira/ClickUp webhook receiver
GET    /api/tickets/:id/impact     Get affected nodes for a ticket
```

### Webhooks

```
POST   /api/webhooks/github        GitHub push event receiver
POST   /api/webhooks/gitlab        GitLab push event receiver
```

### Contract Checker

```
GET    /api/contracts/:repoId      Get all warnings for a repo
GET    /api/contracts/:repoId/pr/:prId  Warnings for a specific PR
POST   /api/contracts/run          Manually trigger contract check
```

### T-GNN

```
POST   /api/tgnn/predict           Get co-change predictions for files
GET    /api/tgnn/model/:repoId     Model status and training progress
POST   /api/tgnn/train             Trigger training run
```

---

## 9. Project Directory Structure

```
overwatch/
├── apps/
│   ├── api/                        # NestJS backend
│   │   ├── src/
│   │   │   ├── modules/
│   │   │   │   ├── repos/          # Repo connection + indexing
│   │   │   │   ├── graph/          # Graph CRUD + query
│   │   │   │   ├── webhooks/       # GitHub/GitLab receivers
│   │   │   │   ├── tickets/        # Jira/ClickUp integration
│   │   │   │   ├── contracts/      # Contract checker service
│   │   │   │   ├── tgnn/           # T-GNN inference bridge
│   │   │   │   └── llm/            # LLM service (Claude/GPT)
│   │   │   ├── neo4j/              # Neo4j driver + queries
│   │   │   └── main.ts
│   │   └── package.json
│   │
│   └── web/                        # React frontend
│       ├── src/
│       │   ├── components/
│       │   │   ├── DiagramCanvas/  # React Flow diagram
│       │   │   ├── NodeCard/       # Node detail side panel
│       │   │   ├── ContractPanel/  # Contract warnings UI
│       │   │   ├── FlowPlayer/     # Animated flow walkthrough
│       │   │   └── ChatBar/        # Conversational query input
│       │   ├── hooks/
│       │   │   ├── useGraph.ts
│       │   │   ├── useWebSocket.ts
│       │   │   └── useContracts.ts
│       │   └── App.tsx
│       └── package.json
│
├── ml/                             # Python ML services
│   ├── tgnn/
│   │   ├── model.py                # T-GNN architecture (PyTorch Geometric)
│   │   ├── train.py                # Training pipeline
│   │   ├── infer.py                # Inference server (FastAPI)
│   │   └── data_loader.py          # Git log → graph dataset
│   └── embeddings/
│       ├── bert_classifier.py      # Sentence-BERT ticket classifier
│       └── fine_tune.py            # Fine-tuning on team data
│
├── docker-compose.yml
└── README.md
```

---

## 10. Development Timeline

| Month | Milestone               | Deliverables                                                                                                                               |
| ----- | ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| 1     | Foundation              | Repo ingestion, Tree-sitter parsing pipeline, Neo4j graph schema, basic React Flow diagram rendering. Working diagram from a real repo.    |
| 2     | Ticket Intelligence     | Jira/ClickUp integration, BERT ticket classifier, ticket badges on diagram. T-GNN data collection + initial training on open source repos. |
| 3     | T-GNN + Live Updates    | T-GNN inference integrated as heatmap overlay. Webhook-driven incremental updates. Conversational query interface grounded in graph.       |
| 4     | Flow Walkthrough        | Animated flow walkthrough. LLM flow reconstruction from static graph. Multi-repo cross-linking.                                            |
| 5     | Contract Checker        | Background daemon architecture. Priority scoring and side panel UI. Full contract checker live.                                            |
| 6     | Evaluation & Submission | Benchmarking, false positive rate measurement, polish, FYP write-up.                                                                       |

---

## 11. Key Implementation Notes

### Tree-sitter parsing

- Use Node.js bindings: `npm install tree-sitter tree-sitter-typescript`
- Parse on first connect (full index), then only re-parse files changed in each push
- Dependency resolver must follow: ES imports, `require()`, HTTP client calls (`axios.get`, `fetch`), DB connection strings

### T-GNN cold start

- Extract training data with: `git log --name-only --pretty=format:'%H %at'`
- Pre-train on public repos (NestJS, Django, Rails) to solve cold start
- Fine-tune begins immediately on target repo from first commit

### LLM grounding (critical constraint)

- LLM must NEVER receive the full repo as context
- For contract checking: LLM receives only the PR diff + T-GNN flagged files
- For conversational queries: LLM receives only the relevant subgraph from Neo4j
- For flow walkthrough: LLM receives only the relevant subgraph, not the full graph

### Neo4j queries (Cypher)

- Impact query: `MATCH (m:Module {id: $id})-[:CO_CHANGES_WITH*1..2]-(related) RETURN related ORDER BY related.tgnnScore DESC`
- Ticket impact: `MATCH (t:Ticket {id: $id})-[:AFFECTS]->(s:Service) RETURN s`

### WebSocket events (frontend)

```
graph:update        → incremental diagram update after push
contract:warning    → new contract warning posted
ticket:mapped       → ticket newly mapped to a node
tgnn:scores         → updated heatmap scores after T-GNN run
```

---

## 12. Academic References

| Reference                                                                                     | Relevance                                                             |
| --------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| Zimmermann et al. (2005) — _Mining Version Histories to Guide Software Changes_ — MSR         | Foundational paper validating file co-change as a predictor of impact |
| Kagdi et al. (2007) — _A Survey and Taxonomy of Approaches for Mining Software Repositories_  | Establishes co-change as a standard SE signal                         |
| Rossi et al. (2020) — _Temporal Graph Networks for Deep Learning on Dynamic Graphs_ — NeurIPS | The T-GNN architecture this project implements                        |

---

## 13. Differentiation Summary

| Competitor     | What they do             | What Overwatch adds                                                  |
| -------------- | ------------------------ | -------------------------------------------------------------------- |
| CodeBoarding   | Static diagrams          | Live updates, ticket awareness, T-GNN, contract checker              |
| Swimm          | Docs that sync with code | Impact prediction, conversational interface, co-change analysis      |
| Datadog        | Runtime observability    | Pre-production risk — from code, not runtime data                    |
| GitHub Copilot | File-level assistance    | System-level architecture awareness, inter-service impact prediction |

---

_This document is the canonical project reference for Overwatch (OpInt). Keep it updated as the system evolves._
