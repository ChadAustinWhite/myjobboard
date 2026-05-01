import { profile } from "../data/profile";
import { IconSearch, IconSliders } from "./Icons";

export function FeedHeader({
  title,
  query,
  setQuery,
  onRefresh,
  syncing,
  syncedLabel,
  subtitle,
  postingCountLabel,
  onOpenSettings,
}: {
  title: string;
  query: string;
  setQuery: (v: string) => void;
  onRefresh: () => void;
  syncing: boolean;
  syncedLabel: string | null;
  subtitle: string | null;
  /** Total / visible posting count, e.g. "128 postings" or "12 of 128 postings". */
  postingCountLabel: string | null;
  onOpenSettings?: () => void;
}) {
  const initials = profile.name
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="sticky top-0 z-10 border-b border-neutral-800 bg-black/90 backdrop-blur-md supports-[backdrop-filter]:bg-black/75">
      <div className="flex min-h-[52px] items-center gap-2 px-3 py-2 sm:gap-3 sm:px-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-neutral-900 text-[13px] font-bold uppercase text-neutral-300 lg:hidden">
          {initials}
        </div>
        <h1 className="min-w-0 flex-1 truncate text-[16px] font-semibold capitalize text-neutral-100 sm:text-[17px]">
          {title}
        </h1>
        <div className="flex shrink-0 items-center gap-2">
          {onOpenSettings && (
            <button
              type="button"
              onClick={onOpenSettings}
              className="rounded-full border border-neutral-700 bg-neutral-950 p-2 text-neutral-200 transition hover:border-sky-500 hover:text-sky-300 [touch-action:manipulation] xl:hidden"
              aria-label="Board settings"
            >
              <IconSliders className="h-[18px] w-[18px]" />
            </button>
          )}
          <button
            type="button"
            onClick={() => void onRefresh()}
            disabled={syncing}
            className="rounded-full border border-neutral-700 bg-neutral-950 px-3 py-2 text-[12px] font-semibold leading-tight text-neutral-50 transition hover:border-sky-500 hover:text-sky-300 [touch-action:manipulation] disabled:pointer-events-none disabled:opacity-50 sm:py-1.5 sm:text-[13px]"
          >
            <span className="sm:hidden">{syncing ? "…" : "Sync"}</span>
            <span className="hidden sm:inline">{syncing ? "Refreshing…" : "Refresh"}</span>
          </button>
        </div>
      </div>

      {(subtitle || syncedLabel || postingCountLabel) && (
        <div className="border-t border-neutral-900 px-3 pb-2 pt-1 text-[11px] leading-snug text-neutral-600 sm:px-4 sm:text-[13px] sm:leading-normal">
          <p className="break-words">
            {postingCountLabel && (
              <>
                <span className="tabular-nums font-medium text-neutral-300">{postingCountLabel}</span>
                {(syncedLabel || subtitle) && (
                  <span className="mx-1 hidden text-neutral-800 sm:inline">·</span>
                )}
              </>
            )}
            {syncedLabel && (
              <>
                <span className="text-neutral-400">{syncedLabel}</span>
                {subtitle && <span className="mx-1 hidden text-neutral-800 sm:inline">·</span>}
              </>
            )}
            {subtitle && <span className={syncedLabel || postingCountLabel ? "block sm:inline" : ""}>{subtitle}</span>}
          </p>
        </div>
      )}
      <div className="border-t border-neutral-800 px-2 pb-3 pt-2 sm:px-3">
        <label className="relative block">
          <span className="pointer-events-none absolute left-[1.125rem] top-1/2 z-10 -translate-y-1/2 text-neutral-500 sm:left-6">
            <IconSearch className="h-[18px] w-[18px]" />
          </span>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search roles, companies, #tags"
            className="block w-full rounded-full border border-neutral-700 bg-neutral-900 py-2.5 pl-10 pr-3 text-[15px] text-neutral-100 outline-none placeholder:text-neutral-600 focus:border-sky-500 sm:pl-12 sm:pr-4"
          />
        </label>
      </div>
    </div>
  );
}
