/** "just now", "5 minutes ago", "3 days ago"; past a month, the date itself. */
export function timeAgo(iso: string, now = Date.now()): string {
  const seconds = Math.round((now - new Date(iso).getTime()) / 1000);
  if (seconds < 60) {
    return 'just now';
  }
  const relative = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) {
    return relative.format(-minutes, 'minute');
  }
  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return relative.format(-hours, 'hour');
  }
  const days = Math.floor(hours / 24);
  if (days < 7) {
    return relative.format(-days, 'day');
  }
  if (days < 30) {
    return relative.format(-Math.floor(days / 7), 'week');
  }
  return new Intl.DateTimeFormat('en', { dateStyle: 'medium' }).format(new Date(iso));
}

/** A `YYYY-MM-DD` day as a local-midnight Date; `new Date('YYYY-MM-DD')` would parse it as UTC. */
export function fromIsoDay(day: string): Date {
  const [year, month, date] = day.split('-').map(Number);
  return new Date(year, month - 1, date);
}

/** A Date's local calendar day as `YYYY-MM-DD`. */
export function toIsoDay(date: Date): string {
  const pad = (value: number) => {
    return String(value).padStart(2, '0');
  };
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}
