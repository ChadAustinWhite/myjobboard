import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { aggregateLiveJobs } from "../api/aggregateLiveJobs";
import { seedJobs as fallbackSeedJobs } from "../data/jobs";
import { buildApplicationDraft } from "../lib/draftApplication";
import { isVisualOnlyDesignFocus } from "../lib/jobFilters";
import { computeMatchScore } from "../lib/matchJob";
import type { BoardSettings } from "../lib/storage";
import {
  loadApplied,
  loadPassed,
  loadSettings,
  saveApplied,
  savePassed,
  saveSettings,
} from "../lib/storage";
import type { AppliedRecord, JobPosting } from "../types";

const SIMULATE_INCOMING = import.meta.env.VITE_SIMULATE_INCOMING === "true";
const MIN_REFRESH_INTERVAL_MS = 120_000;
const BACKGROUND_SYNC_MS = 6 * 60 * 60 * 1000;

const incomingWave: Omit<JobPosting, "postedAt">[] = [
  {
    id: "wave-octave",
    company: "Octave Mobility",
    title: "Senior UX Designer — B2B Operations",
    snippet:
      "Simplify dispatcher and fleet workflows with research-backed UX. Accessibility required; strong Figma; partner with Content and Engineering in agile rituals.",
    applyUrl: "https://example.com/apply/octave-ops-ux",
    location: "Remote — North America",
    remote: true,
    tags: ["ux", "b2b", "accessibility", "figma", "workflows"],
    source: "simulated_tip",
  },
  {
    id: "wave-ember",
    company: "Ember Stays",
    title: "Product Designer — Loyalty",
    snippet:
      "Design member journeys for a hospitality loyalty program. Behavioral design, iterative experiments, partnering with analysts on engagement metrics.",
    applyUrl: "https://example.com/apply/ember-loyalty",
    location: "Remote",
    remote: true,
    tags: ["product design", "travel", "experimentation", "analytics"],
    source: "simulated_tip",
  },
];

function isAutoAssistSource(source: string): boolean {
  return (
    source === "arbeitnow" ||
    source === "remotive" ||
    source === "simulated_tip"
  );
}

function isAbort(error: unknown) {
  return (
    (error instanceof DOMException && error.name === "AbortError") ||
    (error instanceof Error && error.name === "AbortError")
  );
}

export type Toast = { id: string; title: string; body: string };

export type SyncState =
  | { phase: "idle" }
  | { phase: "loading" }
  | { phase: "ok"; fetchedAt: string; usedFallback: boolean }
  | { phase: "error"; message: string };

export function useJobBoard() {
  const [jobs, setJobs] = useState<JobPosting[]>([]);
  const [applied, setApplied] = useState<AppliedRecord[]>(() => loadApplied());
  const [passed, setPassed] = useState<string[]>(() => loadPassed());
  const [settings, setSettings] = useState<BoardSettings>(() => loadSettings());
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState<"feed" | "applied" | "matches">("feed");
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [sync, setSync] = useState<SyncState>({ phase: "loading" });

  const baselineRef = useRef<Set<string> | null>(null);
  const lastFetchAtRef = useRef(0);
  const appliedIdsRef = useRef(new Set<string>());
  const passedIdsRef = useRef(new Set<string>());

  useEffect(() => {
    appliedIdsRef.current = new Set(applied.map((a) => a.jobId));
  }, [applied]);

  useEffect(() => {
    passedIdsRef.current = new Set(passed);
  }, [passed]);

  const rememberAutoAssist = useCallback((jobId: string) => {
    try {
      sessionStorage.setItem(`mb:autoassist:${jobId}`, "1");
    } catch {
      /* ignore quota / privacy mode */
    }
  }, []);

  const hasAutoAssisted = useCallback((jobId: string) => {
    try {
      return sessionStorage.getItem(`mb:autoassist:${jobId}`) === "1";
    } catch {
      return false;
    }
  }, []);

  useEffect(() => {
    saveApplied(applied);
  }, [applied]);

  useEffect(() => {
    savePassed(passed);
  }, [passed]);

  useEffect(() => {
    saveSettings(settings);
  }, [settings]);

  const toast = useCallback((title: string, body: string) => {
    const id =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : String(Date.now());
    setToasts((t) => [...t, { id, title, body }]);
    window.setTimeout(() => {
      setToasts((t) => t.filter((x) => x.id !== id));
    }, 6500);
  }, []);

  const assistApply = useCallback(
    (job: JobPosting, score: number, opts?: { silent?: boolean }) => {
      const draft = buildApplicationDraft(job);
      navigator.clipboard.writeText(draft).catch(() => {});

      if (settings.openApplyTabs) {
        window.open(job.applyUrl, "_blank", "noopener,noreferrer");
      }

      const record: AppliedRecord = {
        jobId: job.id,
        appliedAt: new Date().toISOString(),
        matchScore: score,
        assisted: true,
      };
      setApplied((prev) => {
        const without = prev.filter((a) => a.jobId !== job.id);
        return [record, ...without];
      });
      if (!opts?.silent) {
        toast(
          settings.openApplyTabs ? "Assisted apply" : "Draft copied",
          settings.openApplyTabs
            ? "Application draft copied. Complete submit on the employer site."
            : "Tabs disabled—draft is on your clipboard.",
        );
      }
    },
    [settings.openApplyTabs, toast],
  );

  const handleNewArrivals = useCallback(
    (arrivals: JobPosting[]) => {
      if (settings.autoAssistThreshold === null) return;
      const threshold = settings.autoAssistThreshold;
      const seen = new Set<string>();

      for (const job of arrivals) {
        if (seen.has(job.id)) continue;
        seen.add(job.id);
        if (!isAutoAssistSource(job.source)) continue;

        const score = computeMatchScore(job);
        if (score < threshold) continue;
        if (hasAutoAssisted(job.id)) continue;
        if (appliedIdsRef.current.has(job.id)) continue;
        if (passedIdsRef.current.has(job.id)) continue;

        rememberAutoAssist(job.id);
        assistApply(job, score, { silent: true });
        toast(
          "Auto-assisted apply",
          `${job.company} · ${job.title} (${score}% fit)`,
        );
      }
    },
    [
      assistApply,
      hasAutoAssisted,
      rememberAutoAssist,
      settings.autoAssistThreshold,
      toast,
    ],
  );

  const refresh = useCallback(
    async (force: boolean, signal?: AbortSignal) => {
      const now = Date.now();
      if (!force && now - lastFetchAtRef.current < MIN_REFRESH_INTERVAL_MS) {
        return;
      }

      setSync((prev) => (prev.phase === "loading" ? prev : { phase: "loading" }));

      try {
        const agg = await aggregateLiveJobs(signal);
        if (signal?.aborted) {
          setSync({ phase: "idle" });
          return;
        }

        const errors = Object.entries(agg.errors).filter(([, v]) => v);
        const failedAll = errors.length >= 2 && agg.jobs.length === 0;

        let merged = agg.jobs;

        if (failedAll) {
          merged = fallbackSeedJobs;
          toast(
            "Live boards unavailable",
            "Showing saved sample roles until the network recovers.",
          );
        } else if (errors.length) {
          const detail = errors.map(([k, v]) => `${k}: ${v}`).join(" · ");
          toast("Partial sync", detail);
        }

        const ids = new Set(merged.map((j) => j.id));

        if (baselineRef.current === null) {
          baselineRef.current = ids;
          setJobs(merged);
        } else {
          const arrivals = merged.filter((j) => !baselineRef.current!.has(j.id));
          baselineRef.current = ids;
          setJobs(merged);
          if (arrivals.length) handleNewArrivals(arrivals);
        }

        lastFetchAtRef.current = Date.now();
        setSync({
          phase: "ok",
          fetchedAt: agg.fetchedAt,
          usedFallback: failedAll,
        });
      } catch (e: unknown) {
        if (signal?.aborted || isAbort(e)) {
          setSync({ phase: "idle" });
          return;
        }
        const msg = e instanceof Error ? e.message : "Sync failed";
        setSync({ phase: "error", message: msg });
        setJobs(fallbackSeedJobs);
        baselineRef.current = new Set(fallbackSeedJobs.map((j) => j.id));
        toast("Couldn’t sync", `${msg}. Showing offline samples for now.`);
      }
    },
    [handleNewArrivals, toast],
  );

  const refreshRef = useRef(refresh);
  refreshRef.current = refresh;

  useEffect(() => {
    const ac = new AbortController();
    void refreshRef.current(true, ac.signal);
    return () => ac.abort();
    // Bootstrap once — keep latest implementation via refreshRef.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const id = window.setInterval(() => {
      void refreshRef.current(false);
    }, BACKGROUND_SYNC_MS);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    if (!SIMULATE_INCOMING) return undefined;
    let waveIndex = 0;
    const t = window.setInterval(() => {
      const tpl = incomingWave[waveIndex % incomingWave.length];
      waveIndex += 1;
      const next: JobPosting = {
        ...tpl,
        id: `${tpl.id}-${Date.now()}`,
        postedAt: new Date().toISOString(),
      };
      setJobs((prev) => [next, ...prev]);
      toast("Simulated inbound role", `${next.company} · ${next.title}`);
      handleNewArrivals([next]);
    }, 55_000);
    return () => window.clearInterval(t);
  }, [handleNewArrivals, toast]);

  const matched = useMemo(() => {
    return jobs
      .filter((j) => !isVisualOnlyDesignFocus(j))
      .map((j) => ({ job: j, score: computeMatchScore(j) }));
  }, [jobs]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const base =
      tab === "applied"
        ? matched.filter((m) =>
            applied.some((a) => a.jobId === m.job.id),
          )
        : tab === "matches"
          ? matched.filter((m) => m.score >= 60)
          : matched;

    const withoutPassed =
      tab === "feed"
        ? base.filter((m) => !passed.includes(m.job.id))
        : base;

    if (!q) return withoutPassed;
    return withoutPassed.filter(
      (m) =>
        `${m.job.title} ${m.job.company} ${m.job.snippet} ${m.job.tags.join(" ")}`
          .toLowerCase()
          .includes(q),
    );
  }, [matched, applied, passed, tab, query]);

  const passJob = (id: string) => {
    setPassed((prev) =>
      prev.includes(id) ? prev : [...prev, id],
    );
  };

  const dismissToast = (id: string) => {
    setToasts((t) => t.filter((x) => x.id !== id));
  };

  const reload = useCallback(() => {
    void refreshRef.current(true);
  }, []);

  return {
    jobs,
    matched,
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
    refresh: reload,
  };
}
