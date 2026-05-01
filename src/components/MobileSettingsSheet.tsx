import { useEffect } from "react";
import type { BoardSettings } from "../lib/storage";
import { BoardSettingsPanels } from "./BoardSettingsPanels";

export function MobileSettingsSheet({
  open,
  onClose,
  settings,
  onChange,
}: {
  open: boolean;
  onClose: () => void;
  settings: BoardSettings;
  onChange: (s: BoardSettings) => void;
}) {
  useEffect(() => {
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (!open) return undefined;
    document.addEventListener("keydown", onEsc);
    return () => document.removeEventListener("keydown", onEsc);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open) return null;

  return (
    <>
      <button
        type="button"
        aria-label="Dismiss settings"
        className="fixed inset-0 z-40 cursor-default bg-black/70 backdrop-blur-sm xl:hidden"
        onClick={onClose}
      />
      <div
        className="fixed inset-x-0 bottom-0 z-50 flex max-h-[90dvh] flex-col xl:hidden"
        role="dialog"
        aria-modal="true"
        aria-labelledby="mobile-settings-heading"
      >
        <div className="rounded-t-2xl border border-b-0 border-neutral-700 bg-neutral-950 shadow-[0_-8px_40px_rgba(0,0,0,0.55)] pb-[calc(env(safe-area-inset-bottom,0)+12px)]">
          <div className="sticky top-0 z-10 flex items-center justify-between border-b border-neutral-800 bg-neutral-950 px-4 py-3">
            <h2 id="mobile-settings-heading" className="text-base font-semibold text-neutral-100">
              Feed settings
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="min-h-[44px] min-w-[44px] rounded-full text-lg leading-none text-neutral-400 [touch-action:manipulation] hover:bg-neutral-800 hover:text-neutral-100"
              aria-label="Close"
            >
              ×
            </button>
          </div>
          <div className="overflow-y-auto overscroll-contain px-4 pt-2">
            <p className="mb-4 text-[13px] text-neutral-500">
              Mirrors the desktop panel—assist rules, thresholds, and data sources for transparency.
            </p>
            <BoardSettingsPanels settings={settings} onChange={onChange} />
          </div>
        </div>
      </div>
    </>
  );
}
