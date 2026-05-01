import { useEffect, useState } from "react";
import { Sidebar } from "./components/Sidebar";
import { FeedHeader } from "./components/FeedHeader";
import { JobCard } from "./components/JobCard";
import { MobileSettingsSheet } from "./components/MobileSettingsSheet";
import { MobileTabBar } from "./components/MobileTabBar";
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

  const [mobileSettingsOpen, setMobileSettingsOpen] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1280px)");
    const collapse = () => {
      if (mq.matches) setMobileSettingsOpen(false);
    };
    collapse();
    mq.addEventListener("change", collapse);
    return () => mq.removeEventListener("change", collapse);
  }, []);

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
    <div className="relative mx-auto flex min-h-[100dvh] min-h-screen w-full min-w-0 max-w-[100vw] flex-col bg-black lg:mx-auto lg:max-w-[1600px] lg:flex-row lg:border-x lg:border-neutral-800">
      <Sidebar tab={tab} onTab={setTab} />

      <main className="min-h-0 min-w-0 flex-1 shrink border-neutral-800 pb-[calc(env(safe-area-inset-bottom,0px)+5.75rem)] lg:flex-1 lg:border-r lg:pb-0">
        <FeedHeader
          title={titles[tab]}
          query={query}
          setQuery={setQuery}
          onRefresh={refresh}
          syncing={syncing}
          syncedLabel={syncedLabel}
          subtitle={subtitle}
          onOpenSettings={() => setMobileSettingsOpen(true)}
        />

        <div className="border-b border-neutral-800 px-3 pb-3 pt-1 sm:px-4">
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

      <MobileTabBar tab={tab} onTab={setTab} />
      <MobileSettingsSheet
        open={mobileSettingsOpen}
        onClose={() => setMobileSettingsOpen(false)}
        settings={settings}
        onChange={setSettings}
      />

      <ToastStack items={toasts} onDismiss={dismissToast} />
    </div>
  );
}

function ComposeHint({ syncing }: { syncing: boolean }) {
  return (
    <div className="flex gap-3">
      <div className="mt-1 h-11 w-11 shrink-0 rounded-full bg-neutral-900 text-center text-[13px] font-bold uppercase leading-[2.65rem] text-neutral-400">
        {profile.name
          .split(/\s+/)
          .filter(Boolean)
          .map((w) => w[0])
          .slice(0, 2)
          .join("")}
      </div>
      <div className="min-w-0 flex-1 rounded-3xl border border-neutral-700 bg-transparent px-3 py-2.5 text-[14px] leading-snug text-neutral-500 sm:px-4 sm:text-[15px]">
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
      <div className="px-6 py-12 text-center text-neutral-500 sm:px-10 sm:py-16">
        <p className="text-base sm:text-lg">Pulling Arbeitnow & Remotive…</p>
        <p className="mt-2 text-[14px] leading-snug text-neutral-600 sm:text-[15px]">
          Roles are normalized for UX / product design fit and marketing-only visual lanes are filtered
          out.
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
    <div className="px-6 py-14 text-center text-neutral-600 sm:px-10 sm:py-16">
      <p className="text-base sm:text-lg">{copy}</p>
    </div>
  );
}
