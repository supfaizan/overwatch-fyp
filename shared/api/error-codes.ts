/** Backend `error_code`s the frontend acts on; a feature's own codes stay in that feature. */
export const ERROR_CODE = {
  invalidToken: 'invalid_token',
  missingToken: 'missing_token',
  networkError: 'network_error',
  workspaceNotFound: 'workspace_not_found',
  githubNeedsReauth: 'github_needs_reauth',
} as const;
