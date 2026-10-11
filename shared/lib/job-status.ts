/** A background job's state: repo indexing or a tracker sync (mirrors the backend). */
export const JOB_STATUS = { pending: 'pending', inProgress: 'in_progress', done: 'done', failed: 'failed' } as const;

export type JobStatus = (typeof JOB_STATUS)[keyof typeof JOB_STATUS];

/** How often to re-check something while a job is running. */
export const JOB_POLL_MS = 3_000;

/** Still working in the background, so worth polling. */
export const isRunning = (status: JobStatus | null | undefined) => status === JOB_STATUS.pending || status === JOB_STATUS.inProgress;
