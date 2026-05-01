export function formatDistanceToNow(iso: string): string {
  const ts = Date.parse(iso);
  if (Number.isNaN(ts)) return "";
  let sec = Math.max(1, Math.floor((Date.now() - ts) / 1000));
  if (sec < 60) return `${sec}s`;
  let min = Math.floor(sec / 60);
  if (min < 60) return `${min}m`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  return `${d}d`;
}
