// mirrors the backend connectors (app/connectors)

export const PROVIDER = { jira: 'jira' } as const;

/** A tracker connection's state, as `GET /connections` reports it. */
export const CONNECTION_STATUS = { active: 'active', needsReauth: 'needs_reauth', disconnected: 'disconnected' } as const;

export type ConnectionStatus = (typeof CONNECTION_STATUS)[keyof typeof CONNECTION_STATUS];
