import { formatDistanceToNow } from "../lib/formatTime";
import { tierFromScore } from "../lib/matchJob";
import type { JobPosting } from "../types";
import {
  IconBubble,
  IconHeart,
  IconRepeat,
  IconShare,
} from "./Icons";

export function JobCard({
  job,
  score,
  tab,
  isApplied,
  onAssistApply,
  onPass,
}: {
  job: JobPosting;
  score: number;
  tab: "feed" | "applied" | "matches";
  isApplied: boolean;
  onAssistApply: () => void;
  onPass: () => void;
}) {
  const tier = tierFromScore(score);
  const time = formatDistanceToNow(job.postedAt);
  const matchColor =
    tier === "strong"
      ? "text-emerald-400"
      : tier === "good"
        ? "text-sky-400"
        : "text-neutral-500";

  return (
    <article className="border-b border-neutral-800 px-4 py-3 transition-colors hover:bg-neutral-900/35">
      <div className="flex gap-3">
        <div className="mt-1 h-11 w-11 shrink-0 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-600 text-center text-[13px] font-bold leading-[2.65rem] text-white">
          {job.company
            .split(" ")
            .slice(0, 2)
            .map((s) => s[0])
            .join("")
            .toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <header className="flex flex-wrap items-baseline gap-x-1 gap-y-0.5 leading-5">
            <span className="font-semibold text-neutral-100">{job.company}</span>
            <span className="text-neutral-500">·</span>
            <span className="text-[15px] text-neutral-500">{time}</span>
            <span className="ml-auto text-[13px] font-semibold uppercase tracking-wide text-neutral-600">
              {job.source.replace("_", " ")}
            </span>
          </header>
          <h2 className="mt-0.5 text-[17px] font-semibold text-neutral-50">
            {job.title}
          </h2>
          <p className="mt-2 whitespace-pre-wrap text-[15px] leading-snug text-neutral-200">
            {job.snippet}
          </p>

          <div className="mt-3 flex flex-wrap gap-1.5">
            {job.remote && (
              <span className="rounded-full border border-neutral-700 px-2 py-0.5 text-xs text-neutral-300">
                Remote
              </span>
            )}
            <span className="rounded-full border border-neutral-700 px-2 py-0.5 text-xs text-neutral-300">
              {job.location}
            </span>
            <span className={`rounded-full border border-neutral-800 px-2 py-0.5 text-xs font-semibold ${matchColor}`}>
              {score}% role fit
            </span>
            {job.tags.map((t) => (
              <span
                key={t}
                className="rounded-full bg-neutral-900 px-2 py-0.5 text-xs text-sky-300/90"
              >
                #{t.replace(/\s+/g, "")}
              </span>
            ))}
          </div>

          <footer className="mt-4 flex max-w-md items-center justify-between text-neutral-500">
            <button
              type="button"
              className="group flex flex-1 items-center justify-center gap-2 rounded-full py-1.5 text-sm hover:bg-sky-500/10 hover:text-sky-400"
              aria-label="Notes"
              title="Open role details (demo)"
              onClick={() => window.alert(`${job.company}\n\n${job.snippet}`)}
            >
              <IconBubble className="h-[18px] w-[18px] group-hover:text-sky-400" />
            </button>
            <button
              type="button"
              className="group flex flex-1 items-center justify-center gap-2 rounded-full py-1.5 text-sm hover:bg-emerald-500/10 hover:text-emerald-400"
              onClick={onPass}
              aria-label="Not interested"
              title="Hide from Home"
            >
              <IconRepeat className="h-[18px] w-[18px] group-hover:text-emerald-400" />
            </button>
            {tab !== "applied" ? (
              <button
                type="button"
                className={`group flex flex-1 items-center justify-center gap-2 rounded-full py-1.5 text-sm hover:bg-pink-500/10 hover:text-pink-400 ${
                  isApplied ? "text-pink-500" : ""
                }`}
                onClick={onAssistApply}
                aria-label="Apply on behalf"
              >
                <IconHeart
                  className={`h-[18px] w-[18px] ${
                    isApplied ? "text-pink-500" : "group-hover:text-pink-400"
                  }`}
                />
              </button>
            ) : (
              <span className="flex flex-1 justify-center">
                <span className="text-xs text-neutral-600">Tracked</span>
              </span>
            )}
            <button
              type="button"
              className="group flex flex-1 items-center justify-center gap-2 rounded-full py-1.5 text-sm hover:bg-sky-500/10 hover:text-sky-400"
              onClick={() => {
                navigator.clipboard.writeText(job.applyUrl);
              }}
              aria-label="Copy apply link"
            >
              <IconShare className="h-[18px] w-[18px]" />
            </button>
          </footer>

          {!isApplied && tab !== "applied" ? (
            <div className="mt-4">
              <button
                type="button"
                onClick={onAssistApply}
                className="w-full rounded-full bg-sky-500 py-2 text-center text-[15px] font-semibold text-white shadow-lg shadow-sky-500/25 transition hover:bg-sky-400"
              >
                Apply on my behalf (copy pitch + open form)
              </button>
              <p className="mt-2 text-center text-[13px] text-neutral-600">
                You still submit on the employer site—we prep the draft and tab.
              </p>
            </div>
          ) : null}
        </div>
      </div>
    </article>
  );
}
