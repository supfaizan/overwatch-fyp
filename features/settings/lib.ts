import type { Role } from '@/shared/workspaces/types';
import type { UsageSummary } from './types';

export const ROLE_LABELS: Record<Role, string> = {
  owner: 'Owner',
  admin: 'Admin',
  member: 'Member',
};

const compact = new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 });

/** Token counts the way usage pages show them: 950, 12.3K, 4.1M. */
export const formatTokens = (count: number) => {
  return compact.format(count);
};

/** Dollars to the cent; anything above zero but under a cent reads "<$0.01" rather than free. */
export const formatCost = (usd: number) => {
  return usd > 0 && usd < 0.01 ? '<$0.01' : `$${usd.toFixed(2)}`;
};

/** A bar in the usage chart: one day, or one week on long periods; `start`/`end` are `YYYY-MM-DD`. */
export type UsageBucket = { start: string; end: string; actions: number };

// past a month, one bar per day is too thin to read
const WEEKLY_AFTER_DAYS = 31;
const DAYS_PER_WEEK = 7;

/** Whether a period this long is charted a week per bar. */
export const isWeekly = (days: number) => {
  return days > WEEKLY_AFTER_DAYS;
};

/** `date`'s calendar day where the browser is, as `YYYY-MM-DD`. */
export const localDay = (date: Date) => {
  return date.toLocaleDateString('en-CA');
};

/**
 * The summary's days as chart bars, oldest first: every day of the period including ones with no
 * usage, grouped into weeks (ending today) past a month. `today` is in the browser's time zone, as
 * the summary's days are.
 */
export function usageBuckets(summary: UsageSummary, today: Date): UsageBucket[] {
  const actionsOn = new Map(summary.by_day.map((day) => {
    return [day.day, day.actions];
  }));
  // noon, so stepping back a day never lands on the wrong date across a DST change
  const noon = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 12);
  const days = Array.from({ length: summary.days }, (_, index) => {
    const date = new Date(noon);
    date.setDate(noon.getDate() - (summary.days - 1 - index));
    return localDay(date);
  });
  const size = isWeekly(summary.days) ? DAYS_PER_WEEK : 1;
  const buckets: UsageBucket[] = [];
  // grouped from today backwards, so the last bar is always a full week ending today
  for (let end = days.length; end > 0; end -= size) {
    const chunk = days.slice(Math.max(0, end - size), end);
    buckets.unshift({
      start: chunk[0],
      end: chunk.at(-1) ?? chunk[0],
      actions: chunk.reduce((sum, day) => {
        return sum + (actionsOn.get(day) ?? 0);
      }, 0),
    });
  }
  return buckets;
}

/** How full a limit is: `warning` from 80%, `full` once nothing's left. */
export function meterTone(used: number, limit: number): 'ok' | 'warning' | 'full' {
  if (used >= limit) {
    return 'full';
  }
  return used / limit >= 0.8 ? 'warning' : 'ok';
}

/** How many of a meter's `ticks` to fill: rounded down, so a tick only fills once it's earned. */
export function filledTicks(used: number, limit: number, ticks: number): number {
  if (limit <= 0) {
    return ticks;
  }
  return Math.min(ticks, Math.floor((used / limit) * ticks));
}

/** The coding agents a personal token is set up for, in the order they're offered. */
export const AI_CLIENT = {
  claudeCode: 'claude_code',
  codex: 'codex',
  geminiCli: 'gemini_cli',
  other: 'other',
} as const;
export type AiClient = (typeof AI_CLIENT)[keyof typeof AI_CLIENT];

export const AI_CLIENT_LABELS: Record<AiClient, string> = {
  claude_code: 'Claude Code',
  codex: 'Codex',
  gemini_cli: 'Gemini CLI',
  other: 'Other',
};

// the name the server gets in the tool's own configuration
const SERVER_NAME = 'bearings';
const TOKEN_VARIABLE = 'BEARINGS_MCP_TOKEN';

/** What to run or paste to connect a tool: where it goes, and the text itself. */
export type AiClientSetup = { where: string; text: string };

/** Setup for each tool, with the token in place so it's copied once and never typed. */
export const aiClientSetup = (client: AiClient, url: string, token: string): AiClientSetup => {
  if (client === AI_CLIENT.claudeCode) {
    return {
      where: 'Run in your terminal',
      text:
        `claude mcp add --transport http ${SERVER_NAME} ${url} --header "Authorization: Bearer ${token}"`,
    };
  }
  if (client === AI_CLIENT.codex) {
    return {
      where: `Add to ~/.codex/config.toml, and set ${TOKEN_VARIABLE} in your shell profile`,
      text: [
        `[mcp_servers.${SERVER_NAME}]`,
        `url = "${url}"`,
        `bearer_token_env_var = "${TOKEN_VARIABLE}"`,
        '',
        `# in your shell profile:`,
        `# export ${TOKEN_VARIABLE}="${token}"`,
      ].join('\n'),
    };
  }
  if (client === AI_CLIENT.geminiCli) {
    return {
      where: 'Add to ~/.gemini/settings.json',
      text: JSON.stringify(
        {
          mcpServers: {
            [SERVER_NAME]: { httpUrl: url, headers: { Authorization: `Bearer ${token}` } },
          },
        },
        null,
        2,
      ),
    };
  }
  return {
    where: 'Any tool that connects to a remote MCP server over HTTP',
    text: `URL: ${url}\nHeader: Authorization: Bearer ${token}`,
  };
};

/** Rules for an agent's instructions file, so it reads decisions first and offers to record new ones. */
export const AI_AGENT_RULES = [
  '## Decisions (Bearings)',
  '- Before starting a task, call the Bearings `start_task` tool with what the task is about, and follow the accepted decisions it returns.',
  '- When we settle a choice others should know about (architecture, API shape, data model, a library, a product rule, a trade-off), ask me whether to record it, then call `record_decision` with my own words.',
  '- Record questions we leave unsettled as `open_question`.',
  '- Search first so nothing is recorded twice. Never put secrets or personal data in a record.',
  '- What you record is a proposal for the team to review: never call it decided.',
].join('\n');

/** Where each assistant that signs in (no token to paste) takes the server's address. */
export const AI_SIGN_IN_STEPS: { name: string; steps: string }[] = [
  {
    name: 'Claude',
    steps: 'Settings > Connectors > Add custom connector, then paste the address.',
  },
  {
    name: 'ChatGPT',
    steps: 'Settings > Apps & Connectors > add a custom MCP server, then paste the address.',
  },
  {
    name: 'Gemini',
    steps: 'Settings > Connected apps > add a custom connector, then paste the address.',
  },
  {
    name: 'Claude Code',
    steps: 'Run `claude mcp add --transport http bearings <address>`, then `/mcp` to sign in.',
  },
];
