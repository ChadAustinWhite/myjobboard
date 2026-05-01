import { useEffect, useReducer } from "react";

/** Bumps periodically so relative-time labels (e.g. formatDistanceToNow) actually advance. */
export function useTimeTick(intervalMs = 30_000): number {
  const [tick, bump] = useReducer((n: number) => n + 1, 0);

  useEffect(() => {
    const id = window.setInterval(() => bump(), intervalMs);
    return () => window.clearInterval(id);
  }, [intervalMs, bump]);

  return tick;
}
