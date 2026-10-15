# Confluence connector plan (two-way, feeds Docs)

Status: approved, not started. This is the first docs integration. ClickUp Docs, Linear and Google Docs follow behind the same port.

Repos:

- BE: `overwatch-BE`
- FE: `overwatch-fyp`

Items marked **[verify]** must be checked against Atlassian's docs before they are used.

## Decisions

1. **Write-back.** A local edit is pushed to its source (Confluence, or whichever source the doc is linked to) after 60 s with no further edits. Edits made in that window go out as one remote version.
2. **Conflicts.** If the remote page changed since the last sync:
   - load the remote version;
   - keep the local copy for resolving;
   - the user chooses between keeping the remote version, overwriting it, or copying their own version.
3. **Visibility (v1).** Sync uses the token of the admin who connected. Every member sees every page that admin can see in the selected spaces, and edits appear in Confluence as that admin, with a version note naming the real editor. Later, each member connects their own account (Jira, ClickUp, …) to read and write through it. This is out of scope now.
4. **Archive.** Archiving a mirrored page in Overwatch archives it in Confluence. The Archive view gets a **Delete permanently** action. Archived docs are garbage-collected 30 days after archiving.

## 0. What exists today (verified)

### Connector framework (`app/connectors/`)

- `ports.py`: `WorkItemSource` and `AuthBackend.request(conn, method, url)`.
- `registry.py`: `Connector(provider, oauth, adapter, write_scope, sprint_scope)`. Each connector gets its own `NativeOAuth` backend.
- `oauth.py`: generic `OAuth2Flow`.
- `auth_backends.py`: `NativeOAuth`. It retries once on 429 when `Retry-After` is 10 s or less, and detects Atlassian's "scope does not match" 401.
- `sync.py`: `run_work_item_sync`. It claims and releases the `sync_targets` row as a lock. Runs are incremental, with a full run every hour that also sweeps deletions.
- `service.py`: `catalog`, `can_write` (checks `write_scope` against `conn.scopes`) and `complete_authorization`.
- Scheduling: `app/workers/jobs.py` `run_connector_sync` calls `run_work_item_sync`. The loop in `main.py` runs every `ticket_sync_interval_seconds` (300).
- Write-back pattern: `work_items/service.update` calls the adapter synchronously, then `_refresh`.
- Everything is keyed by `provider`:
  - `connections (workspace_id, provider)`, unique;
  - `sync_targets (workspace_id, provider, key)`;
  - `oauth_tokens (owner_id, provider)`, with `owner_id` set to the workspace id.
- The Atlassian redirect URI is `/jira/callback`. `app/jira/router.py` passes it to `oauth_callback(Provider.JIRA, …)`.
- `jira.py` already has `adf_to_markdown` and `markdown_to_adf`.

### Docs

- Pages may already have child pages. `service.create` doesn't check the parent's kind.
- Mirrored docs are read-only. This is enforced in four places:
  - `_editable` (`source == NATIVE_SOURCE`);
  - the `source=NATIVE_SOURCE` filter in `repository.update/save_content`;
  - `parent_is_mirrored` in create and archive-move;
  - `attachments.start_upload`.
- `MAX_DEPTH = 10`.
- `target_key`, `external_id` and `external_url` exist, with a unique partial index on `(workspace_id, source, external_id)`.

### FE

- `features/settings/components/integrations-section.tsx`: an `IssueTracker` card per connection, with an `AddTarget` select.
- `shared/connections/constants.ts`: `PROVIDER`.
- `doc-page.tsx` handles `doc_conflict`. `doc-tree.tsx` and `doc-page.tsx` gate actions on `editable`. The `DocImage` node is in `image.ts`.

## 1. Several products on one Atlassian credential

Options considered:

| Option | What it is | Trade-off |
| --- | --- | --- |
| A | A separate Confluence connection and token | Two consents, two rotating refresh-token families, and a single callback anyway |
| B | One `atlassian` connection with capabilities | Renames `work_items.source` and `boards.source` from `jira`, which needs a large migration |
| **C (chosen)** | Credential groups | Connections stay per product (`jira`, `confluence`) and share one OAuth app and token row |

**Constants** (`app/core/constants.py`):

- `CredentialGroup.ATLASSIAN`
- `Provider.CONFLUENCE`
- `ConnectorCategory {WORK_ITEMS, DOCUMENTS}`

**Registry**

- `Connector` gains `category`, `credential: CredentialGroup | None` and `scopes`. Its adapter is `WorkItemSource | DocSource`.
- New accessors `registry.work_item_source(p)` and `registry.doc_source(p)`. Each raises if the provider has the wrong category.
- New `registry.credential_key(provider)`. Use it in `NativeOAuth` (instead of `flow.config.provider`), in `service.auth_status`, and in `onboarding/router.py`.

**Consent and OAuth state**

- Authorize asks only for the connector's own scopes plus those of products already active in its group. A Jira-only workspace never sees Confluence scopes.
- The OAuth state carries the provider (`user.ws.return_to.provider.rand`).
- The cookie is scoped to the group's redirect path, which stays `/jira/callback`. The callback reads the provider from the state.

**`complete_authorization`**

1. Save the token under the group key.
2. Upsert this connection.
3. Refresh `scopes` on the group's other active connections.
4. Pick the site: the existing Jira site if there is one (one site per workspace), otherwise the first site with Confluence. If the site has no Confluence, fail with `no_docs_site`.

**`disconnect`**: only mark the token DISCONNECTED once no other product in the group is still active.

**Effect on existing setups**

- No reconnect is needed. Jira keeps working, and "Connect Confluence" runs one combined consent.
- Whoever consents last owns the shared grant.

**Migration**: `scripts/migrate_atlassian_credentials.py`, dry run by default, `--apply` to write, idempotent, following the `migrate_connectors.py` pattern. It renames `oauth_tokens.provider` from `jira` to `atlassian`.

**Atlassian app setup**

- Enable the Confluence API on the same Atlassian app.
- Scopes **[verify]**:
  - `read:space:confluence`
  - `read:page:confluence`
  - `write:page:confluence`
  - `read:hierarchical-content:confluence`
  - `read:attachment:confluence`
  - `read:user:confluence`
  - maybe `read:folder:confluence`
  - P4 adds archive, move and delete scopes (`delete:page:confluence` and/or `write:confluence-content`)
  - keep `offline_access`
- `write_scope = "write:page:confluence"`.

## 2. DocSource port, and where Nango fits

`app/connectors/ports.py`:

```python
class DocSource(Protocol):
    async def resolve_account(self, access_token: str, known_site_id: str | None) -> dict
    async def list_targets(self, auth, conn) -> list[dict]  # spaces [{key: space_id, name, id}]
    async def list_nodes(self, auth, conn, target_key, *, changed_since: datetime | None, page_token: str | None) -> Page
        # metadata only: {external_id, kind, parent_external_id, title, position, external_version, status, external_url, updated_at}
    async def fetch_bodies(self, auth, conn, external_ids: list[str]) -> dict[str, dict]  # {title, content (Tiptap JSON), content_md, external_version}
    def target_root(self, conn, target: dict) -> dict  # the space's folder node
    async def update_page(self, auth, conn, external_id, *, title, content: dict, base_external_version: int) -> int  # new version; raises RemoteConflict
    async def create_page(self, auth, conn, target_key, parent_external_id: str | None, title, content) -> dict  # P4
    async def move_page(self, auth, conn, external_id, parent_external_id, after_external_id: str | None) -> None  # P4
    async def archive_page(self, auth, conn, external_id) -> None  # P4
    async def delete_page(self, auth, conn, external_id) -> None  # P4, permanent delete
```

- The port speaks our canonical format: Tiptap JSON plus Markdown. Each adapter converts internally, so ClickUp (Markdown) and Google Docs plug in the same way.
- **Nango** goes behind the existing `AuthBackend`, not the port.
  - The plan is a `NangoCredentials` backend that fetches a fresh token from Nango and signs requests itself, so adapters keep absolute URLs. Nango's proxy, the alternative, would force relative paths.
  - Connecting would go through a Nango Connect session instead of our callback. Its FE SDK would be a new dependency.
  - Not built now. Only `AuthBackendName.NANGO` is reserved.

## 3. Mapping

| Confluence | Overwatch |
| --- | --- |
| Space | A `sync_target` whose `key` is the space **id**, not the key: the `TargetKey` regex rejects personal keys like `~abc`, and ids survive key changes. It also becomes a top-level `folder` with `source=confluence`, `external_id="space:{id}"` and `target_key=space_id`. |
| Page | A `page` node. Pages keep their children. The space homepage is mirrored as it is: a page inside the folder, with the space's pages under it. |
| Confluence folder (v2 `/folders`) | `folder` node |
| Whiteboards, databases | Skipped |

- `rank` comes from Confluence `position`.
- `ancestor_ids` and `child_count` are computed in memory from the full parent map, so sync never calls `rebase`.
- `MAX_DEPTH` applies only to native creates and moves. Mirrored trees keep their real depth.

## 4. Content conversion: ADF on the BE

**Why ADF and not storage XHTML.** ADF is ProseMirror-shaped like Tiptap, so conversion is node to node in Python with no new dependency. XHTML with `ac:` macros would need a parser and would lose content.

**Why the BE.** Sync and the push worker run without a browser, and the BE already stores `content_md`.

**Where the code goes.** Move the ADF helpers out of `jira.py` into `app/connectors/atlassian/adf.py`, shared by both adapters. Conversion lives in `atlassian/adf_tiptap.py` (`adf_to_tiptap`, `tiptap_to_adf`).

| ADF | Tiptap | Notes |
| --- | --- | --- |
| `paragraph`, `heading`, `blockquote`, `rule`, `hardBreak`, `codeBlock` | same | |
| `bulletList` | `bulletList` | |
| `orderedList` (`order`) | `orderedList` (`start`) | |
| `taskList` / `taskItem` | `taskList` / `taskItem` | ADF uses inline content with `state` TODO/DONE; Tiptap uses a paragraph with `checked`. Wrap and unwrap, and keep `localId`. |
| `table` / `tableRow` / `tableHeader` / `tableCell` | same | `colspan`, `rowspan` and `colwidth[]` match. `background` goes in a preserved attribute. |
| marks `strong` / `em` / `strike` / `code` / `underline` / `link` | `bold` / `italic` / `strike` / `code` / `underline` / `link` | |
| `alignment` mark (center / end) | `textAlign` (center / right) | |

**Lossless round trip.** Unsupported content is preserved, not dropped:

- `sourceBlock` and `sourceInline` are atom nodes with `{raw: <original ADF>, label}`.
- `sourceMark {marks: [...]}` carries unsupported marks such as textColor and subsup.
- These cover panel, expand, layouts, decisions, extensions and macros, mention, emoji, status, date and cards.
- They are written back verbatim on push.
- They render read-only, for example "Jira issues macro: edit in Confluence". Users can delete them but not edit inside them.
- `content_md` for mirrored pages is computed on the BE from the ADF.

**Images: copied during sync.**

- They are stored in our object store as `doc_attachments` `{source, external_id: att_id, external_version}`, reusing the existing key, signing and `attachment_urls` paths.
- ADF `media` nodes are matched to attachments by `fileId`, via v2 `/pages/{id}/attachments`.
- The `image` node keeps `attachmentId` plus `raw`, so the push can restore the original media node.
- Uploading new images to Confluence comes later. Until then `start_upload` keeps rejecting mirrored pages.
- Rejected alternative: an authenticated proxy. It hits Atlassian's rate limits on every view, and images break when Confluence is disconnected.

**Links.** Kept as they are. Rewriting them to internal links comes later.

## 5. Pull sync (`app/connectors/doc_sync.py`)

**Scheduling**

- `jobs.run_connector_sync` dispatches by category.
- Extract the claim/finish wrapper from `sync.py` into `run_target(workspace_id, provider, key, body)`.

**Full run (the first one, then hourly)**

1. Page through the metadata only: v2 `GET /wiki/api/v2/spaces/{id}/pages?depth=all&limit=250`, and folders. The cursor is `_links.next`.
2. `bulk_write` upsert the metadata.
3. Fetch bodies only where `external_version` changed. Batch them via `GET /pages?id=…&body-format=atlas_doc_format` **[verify]**, with at most 4 requests in flight (`asyncio.Semaphore(4)`).
4. Archive locally any node not seen, or seen as archived or trashed (`archived_by=None`, `archived_by_sync=True`).

**Incremental run (every 5 min)**

- Use `sort=-modified-date` and stop at `last_synced_at - OVERLAP_MINUTES` **[verify]**.
- Fallback: CQL `lastmodified >= now("-Nm")`, which needs the `search:confluence` scope.

**Other behaviour**

- No webhooks: 3LO apps need Connect or Forge for those.
- An interrupted import resumes by itself, because nodes whose version matches are skipped. No cursor is persisted.
- A 429 fails the run, and the next poll retries.
- Removing a target archives its space subtree. Re-adding it restores the subtree.
- After a disconnect, pages stay visible but read-only.
- A pulled content change bumps local `version`, so an open editor gets the existing `doc_conflict`.

## 6. Write-back (outbox on the document)

**Saving**

- A local save writes immediately, as today.
- It also sets `push_state=pending` and `push_due_at = now + DOC_PUSH_IDLE_SECONDS` (60). Each further save pushes `push_due_at` back, so a burst of edits goes out as one version.

**Pushing**

- `_doc_push_loop` runs every 10 s.
- It claims a doc with `find_one_and_update` (`pending` → `pushing`).
- It calls `update_page` with `version.number = external_version + 1` and the message "Edited by {name} via Overwatch". This is v2 `PUT /pages/{id}` with `representation: atlas_doc_format`.
- The loop is generic over `DocSource`, so every linked source is pushed the same way.

**Conflicts**

- On a remote 409, or a stale `external_version`:
  - store the local copy in `conflict_content`;
  - load the remote content;
  - set `push_state=conflict`;
  - bump `version`.
- Resolving: `POST /documents/{id}/resolve-conflict {action: keep_remote | overwrite}`. `overwrite` pushes on top of the remote version.
- If a pull arrives while a push is pending:
  - remote version unchanged: skip the body;
  - remote version moved: take the conflict path.

**Still read-only**

- the content inside `source*` nodes;
- image upload;
- create, move and archive until P4;
- folders and space roots.

**Docs service and repository changes**

- `update` and `save_content` take an `allowed_sources` set instead of `source=NATIVE_SOURCE`.
- `_editable(doc, writable_sources)` is true for a native doc, or for a mirrored **page** whose provider can write and which has no open conflict.
- `writable_sources` costs one connections query per request, as `work_items._writable_sources` does.

## 7. Archive, permanent delete, garbage collection

- **Archive.**
  - Archiving a mirrored page archives it in Confluence (`archive_page`, P4) **[verify the endpoint]**.
  - The local archive behaviour is unchanged (`archived_at`, `archive_root_id`).
- **Delete permanently.**
  - An action on each row of the Archive view.
  - It hard-deletes the archived subtree and its attachments: the `doc_attachments` rows and the storage objects via `ObjectStore.delete`.
  - For mirrored pages it also calls `delete_page` at the source. For Confluence this is trash, then purge, if the scope allows it **[verify]**.
- **Garbage collection.**
  - A periodic job purges archive roots whose `archived_at` is more than 30 days old (`DOC_ARCHIVE_RETENTION_DAYS=30`), the same way as a permanent delete.
  - It uses the existing partial index `(workspace_id, archived_at -1)` where `archived_root: true`.
  - This also covers the cleanup of orphaned attachments for deleted pages.

## 8. Data and indexes

**`documents`**

- New fields:
  - `external_version: int`
  - `external_parent_id`
  - `synced_at`
  - `push_state`: StrEnum `DocPushState {NONE, PENDING, PUSHING, CONFLICT, FAILED}`
  - `push_due_at`
  - `push_error`
  - `conflict_content`
  - `archived_by_sync: bool`
- New indexes:
  - `(workspace_id, source, target_key)`, for sweeps;
  - `(push_state, push_due_at)`, partial on `{push_state: "pending"}`. Partial indexes can't use `$in`.

**`doc_attachments`**

- New fields: `source`, `external_id`, `external_version`.
- Unique partial index on `(workspace_id, source, external_id)`.

**Other**

- The `/connections` catalog gains `category`.
- Settings: `doc_push_idle_seconds`, `doc_push_interval_seconds`, `doc_archive_retention_days`. Reuse `jira_client_id` and `jira_client_secret`; renaming them comes later.
- Migrations: only the credential rename. New document fields are read with `.get`.

## 9. FE

- **`shared/connections/constants.ts`:** add `confluence` to `PROVIDER`, and `CONNECTOR_CATEGORY`.
- **`integrations-section.tsx`:**
  - Generalise `IssueTracker` into a card driven by category.
  - The docs card is labelled "Docs", with the BookOpen icon from phosphor, which is already installed.
  - The picker reads "Add a space to sync". Show a "Uses your Atlassian connection" note.
- **`features/docs/types.ts`:** add `push_state` and `synced_at`.
- **`doc-tree.tsx`:** source badge. Hide new and move actions under mirrored nodes until P4.
- **`doc-page.tsx`:**
  - an "Open in Confluence" link (`external_url`);
  - sync status: "Synced 2m ago", "Saving to Confluence…" or "Not synced";
  - a conflict banner: Keep Confluence's / Overwrite / Copy mine;
  - no image button on mirrored pages.
- **`features/docs/source-nodes.ts`:** `SourceBlock`, `SourceInline` and `SourceMark`, each with a read-only node view and `renderMarkdown`. Register them in `doc-editor.tsx`.
- **`archive-list.tsx`:** a "Delete permanently" action with a confirm dialog, plus a note that archived pages are deleted after 30 days.
- **Vitest:** status-label and node-label helpers in `lib.ts` / `lib.test.ts`.

## 10. Phases (one PR per repo each)

**P0, framework**

- Scope: credential groups and categories, the provider in the OAuth state, category dispatch in jobs, the migration script.
- Tests: `test_connections_api` (shared grant, disconnecting one product keeps the other), `test_native_oauth`, `test_migrate_atlassian_credentials`.

**P1, read-only import**

- Scope:
  - the adapter: `app/connectors/confluence.py`, `atlassian/adf.py`, `atlassian/adf_tiptap.py`;
  - full pull;
  - space picker, badge and link;
  - read-only source nodes;
  - images shown as placeholders.
- Tests:
  - respx `test_confluence_adapter.py`: pagination and bodies;
  - unit `test_adf_tiptap.py`: per-node fixtures, and `tiptap_to_adf(adf_to_tiptap(x)) == x` for opaque nodes;
  - integration `test_document_sync.py`: the tree, `ancestor_ids` and `child_count`.

**P2, keeping up to date**

- Scope: incremental sync, remote deletions and archives, image copy, sync status in the UI.
- Tests: where the incremental run stops, a move updates ancestors, the archive sweep, skipping unchanged versions, attachment dedup.

**P3, write-back**

- Scope: the outbox, the push loop, conflicts, editable mirrored pages, the conflict UI.
- Tests: `test_document_writeback.py`:
  - enqueueing and coalescing;
  - the PUT body and version;
  - 409 → conflict;
  - both resolve actions;
  - disconnected → read-only.

**P4, structure and lifecycle**

- Scope:
  - create, rename-only, move and archive, mirrored to Confluence: v2 `POST /pages` and the v1 move `/content/{id}/move/{pos}/{target}` **[verify]**;
  - "Delete permanently" in the Archive view;
  - the 30-day archive garbage collection, for native and mirrored docs.
- Tests: archive mirrors to the source; delete removes the subtree, its attachments and the remote page; garbage collection purges only roots older than 30 days.

**Later**

- Image upload to Confluence.
- Per-member accounts per source.
- ClickUp Docs, Linear, Google Docs.
- The Nango auth backend.

## Open items to verify

- Exact granular scope names.
- Batching bodies by id together with `body-format`.
- `sort=-modified-date` on the v2 pages listing.
- The move, archive and purge endpoints.
- Whether an Atlassian 3LO app allows more than one callback URL.

## Conventions

- No magic strings: use StrEnums and constants.
- Generic naming (`document`, `doc_source`); `confluence` appears only inside the adapter.
- No new dependencies without approval.
- Existing test tooling: pytest, mongomock-motor, respx, vitest.
- No AI attribution anywhere.
