/** Sequential SSE poll — never overlaps, even if a tick is slower than the interval. */
export function startSsePoll(
  poll: () => Promise<void>,
  intervalMs: number,
  isClosed: () => boolean,
): () => void {
  let timer: ReturnType<typeof setTimeout> | null = null;
  let stopped = false;

  const schedule = () => {
    if (stopped || isClosed()) return;
    timer = setTimeout(run, intervalMs);
  };

  const run = async () => {
    if (stopped || isClosed()) return;
    try {
      await poll();
    } catch {
      // callers log inside poll
    }
    schedule();
  };

  schedule();

  return () => {
    stopped = true;
    if (timer) clearTimeout(timer);
    timer = null;
  };
}
