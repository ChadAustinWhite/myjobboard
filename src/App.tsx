import { Sidebar } from "./components/Sidebar";
import { FeedHeader } from "./components/FeedHeader";
import { JobCard } from "./components/JobCard";
import { RightRail } from "./components/RightRail";
import { ToastStack } from "./components/ToastStack";
import { profile } from "./data/profile";
import { useJobBoard } from "./hooks/useJobBoard";
import { formatDistanceToNow } from "./lib/formatTime";

export default function App() {
  const {
    filtered,
    tab,
    setTab,
    query,
    setQuery,
    settings,
    setSettings,
    applied,
    assistApply,
    passJob,
    toasts,
    dismissToast,
    sync,
    refresh,
  } = useJobBoard();

  const titles: Record<typeof tab, string> = {
    feed: "For you · roles",
    matches: "Strong matches",
    applied: "Applied log",
  };

  const syncing = sync.phase === "loading";
  const syncedLabel =
    sync.phase === "ok"
      ? `Updated ${formatDistanceToNow(sync.fetchedAt)} ago${
          sync.usedFallback ? " · sample backup" : ""
        }`
      : sync.phase === "error"
        ? `Sync issue — ${sync.message}`
        : null;

  const subtitle =
    "US + US-friendly remote only · Arbeitnow · Remotive · Remote OK · Jobicy · Indeed (optional proxy) · auto-refresh (~5 min)";

  return (
    <div className="mx-auto flex min-h-screen max-w-[990px] border-x border-neutral-800">
      <Sidebar tab={tab} onTab={setTab} />

      <main className="min-h-screen flex-1 min-w-0 border-r border-neutral-800">
        <FeedHeader
          title={titles[tab]}
          query={query}
          setQuery={setQuery}
          onRefresh={refresh}
          syncing={syncing}
          syncedLabel={syncedLabel}
          subtitle={subtitle}
        />

        <div className="border-b border-neutral-800 px-4 pb-3 pt-1">
          <ComposeHint syncing={syncing} />
        </div>

        {filtered.length === 0 ? (
          <EmptyState tab={tab} loading={syncing} />
        ) : (
          filtered.map(({ job, score }) => (
            <JobCard
              key={job.id}
              job={job}
              score={score}
              tab={tab}
              isApplied={applied.some((a) => a.jobId === job.id)}
              onAssistApply={() => assistApply(job, score)}
              onPass={() => passJob(job.id)}
            />
          ))
        )}
      </main>

      <RightRail settings={settings} onChange={setSettings} />

      <ToastStack items={toasts} onDismiss={dismissToast} />
    </div>
  );
}

function ComposeHint({ syncing }: { syncing: boolean }) {
  return (
    <div className="flex gap-3">
      <div className="mt-1 h-11 w-11 shrink-0 rounded-full bg-neutral-900 text-center text-[13px] font-bold uppercase leading-[2.65rem] text-neutral-400">
        {profile.name
          .split(" ")
          .map((w) => w[0])
          .slice(0, 2)
          .join("")}
      </div>
      <div className="min-w-0 flex-1 rounded-3xl border border-neutral-700 bg-transparent px-4 py-3 text-[15px] text-neutral-500">
        {syncing ? (
          <span className="text-neutral-400">Hydrating postings from remote boards…</span>
        ) : (
          <>
            Searching for UX leadership across product-heavy orgs aligned with&nbsp;
            <span className="font-semibold text-neutral-400">your portfolio pillars</span>
            …
          </>
        )}
      </div>
    </div>
  );
}

function EmptyState({
  tab,
  loading,
}: {
  tab: "feed" | "applied" | "matches";
  loading: boolean;
}) {
  if (loading && tab === "feed") {
    return (
      <div className="px-10 py-16 text-center text-neutral-500">
        <p className="text-lg">Pulling Arbeitnow & Remotive…</p>
        <p className="mt-2 text-[15px] text-neutral-600">
          Roles are normalized for UX / product design fit and marketing-only visual lanes are
          filtered out.
        </p>
      </div>
    );
  }

  const copy =
    tab === "feed"
      ? "No fresh roles yet—signals will land here."
      : tab === "matches"
        ? "No strong matches saved for this slice."
        : "No assisted applications tracked yet.";
  return (
    <div className="px-10 py-16 text-center text-neutral-600">
      <p className="text-lg">{copy}</p>
    </div>
  );
}
