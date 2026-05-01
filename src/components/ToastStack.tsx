import type { Toast } from "../hooks/useJobBoard";

export function ToastStack({
  items,
  onDismiss,
}: {
  items: Toast[];
  onDismiss: (id: string) => void;
}) {
  return (
    <div
      className="fixed bottom-6 right-4 z-50 flex w-[min(100%-2rem,22rem)] flex-col gap-2"
      aria-live="polite"
    >
      {items.map((t) => (
        <div
          key={t.id}
          className="rounded-2xl border border-neutral-700 bg-neutral-950/95 p-3 shadow-2xl shadow-black/70 backdrop-blur"
        >
          <div className="flex gap-3">
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-neutral-50">{t.title}</p>
              <p className="text-sm text-neutral-400">{t.body}</p>
            </div>
            <button
              type="button"
              onClick={() => onDismiss(t.id)}
              className="h-7 shrink-0 rounded-full px-2 text-neutral-400 hover:bg-neutral-800 hover:text-neutral-100"
              aria-label="Dismiss"
            >
              ×
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
