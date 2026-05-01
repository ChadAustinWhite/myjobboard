import { IconSearch } from "./Icons";

export function FeedHeader({
  title,
  query,
  setQuery,
  onRefresh,
  syncing,
  syncedLabel,
  subtitle,
}: {
  title: string;
  query: string;
  setQuery: (v: string) => void;
  onRefresh: () => void;
  syncing: boolean;
  syncedLabel: string | null;
  subtitle: string | null;
}) {
  return (
    <div className="sticky top-0 z-10 border-b border-neutral-800 bg-black/85 backdrop-blur-md">
      <div className="flex h-[53px] items-center gap-3 px-4">
        <h1 className="min-w-0 flex-1 truncate text-[17px] font-semibold capitalize text-neutral-100">
          {title}
        </h1>
        <button
          type="button"
          onClick={() => void onRefresh()}
          disabled={syncing}
          className="rounded-full border border-neutral-700 bg-neutral-950 px-3 py-1.5 text-[13px] font-semibold text-neutral-50 transition hover:border-sky-500 hover:text-sky-300 disabled:pointer-events-none disabled:opacity-50"
        >
          {syncing ? "Refreshing…" : "Refresh"}
        </button>
      </div>
      {(subtitle || syncedLabel) && (
        <div className="border-t border-neutral-900 px-4 pb-1 text-[13px] text-neutral-600">
          {syncedLabel && <span className="text-neutral-400">{syncedLabel}</span>}
          {syncedLabel && subtitle && <span className="mx-2 text-neutral-800">·</span>}
          {subtitle}
        </div>
      )}
      <div className="border-t border-neutral-800 px-3 pb-3">
        <label className="relative block">
          <span className="pointer-events-none absolute left-6 top-1/2 z-10 -translate-y-1/2 text-neutral-500">
            <IconSearch className="h-[18px] w-[18px]" />
          </span>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search roles, companies, #tags"
            className="block w-full rounded-full border border-neutral-700 bg-neutral-900 py-2.5 pl-12 pr-4 text-[15px] text-neutral-100 outline-none placeholder:text-neutral-600 focus:border-sky-500"
          />
        </label>
      </div>
    </div>
  );
}
