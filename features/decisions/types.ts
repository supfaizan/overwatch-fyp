export type CheckResult = {
  /** changed items and pages read */
  checked: number;
  /** contradicting passages added to decisions */
  conflicts: number;
  /** the day's checks ran out before everything changed was read */
  capped: boolean;
};

/** Whether accepted decisions are checked against what changed every half hour (on by default). */
export type CheckSettings = {
  enabled: boolean;
  last_run_at: string | null;
  last_result: CheckResult | null;
};
