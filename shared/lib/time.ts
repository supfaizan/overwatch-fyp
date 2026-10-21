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
