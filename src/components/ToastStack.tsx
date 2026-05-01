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
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 bottom-[calc(env(safe-area-inset-bottom,0px)+6rem)] z-40 flex justify-center px-3 lg:inset-auto lg:bottom-6 lg:right-4 lg:w-[min(100vw-2rem,22rem)] lg:flex-col lg:items-end"
    >
      <div className="pointer-events-auto flex w-full max-w-md flex-col gap-2">
        {items.map((t) => (
          <div
            key={t.id}
            className="rounded-2xl border border-neutral-700 bg-neutral-950/95 p-3 shadow-2xl shadow-black/70 backdrop-blur"
          >
            <div className="flex gap-3">
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-neutral-50">{t.title}</p>
                <p className="text-sm leading-snug text-neutral-400">{t.body}</p>
              </div>
              <button
                type="button"
                onClick={() => onDismiss(t.id)}
                className="flex h-11 min-w-[44px] shrink-0 items-center justify-center rounded-full px-2 text-neutral-400 [touch-action:manipulation] hover:bg-neutral-800 hover:text-neutral-100"
                aria-label="Dismiss"
              >
                ×
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
