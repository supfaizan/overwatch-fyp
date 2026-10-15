// mirrors the backend connectors (app/connectors)

export const PROVIDER = { jira: 'jira', confluence: 'confluence' } as const;

/** What a connector mirrors: tracker tickets (board) or pages (docs). */
export const CONNECTOR_CATEGORY = { workItems: 'work_items', documents: 'documents' } as const;
export type ConnectorCategory = (typeof CONNECTOR_CATEGORY)[keyof typeof CONNECTOR_CATEGORY];

/** A tracker connection's state, as `GET /connections` reports it. */
export const CONNECTION_STATUS = { active: 'active', needsReauth: 'needs_reauth', disconnected: 'disconnected' } as const;

export type ConnectionStatus = (typeof CONNECTION_STATUS)[keyof typeof CONNECTION_STATUS];
