import type { BoardSettings } from "../lib/storage";

/**
 * Shared between desktop right rail (`RightRail`) and the mobile sheet—same Tailwind primitives.
 */
export function BoardSettingsPanels({
  settings,
  onChange,
  className = "",
}: {
  settings: BoardSettings;
  onChange: (s: BoardSettings) => void;
  className?: string;
}) {
  const th = settings.autoAssistThreshold ?? 72;
  const autoOn = settings.autoAssistThreshold !== null;

  return (
    <div className={`space-y-6 ${className}`}>
      <div className="rounded-2xl border border-neutral-800 bg-black p-4">
        <h2 className="text-lg font-bold text-neutral-100">Auto-assist</h2>
        <p className="mt-1 text-[14px] leading-snug text-neutral-500">
          When a freshly ingested posting clears your threshold, your draft copies and the apply URL
          opens automatically (employer submits still manual).
        </p>

        <div className="mt-5 flex items-center gap-3 py-1">
          <button
            type="button"
            role="switch"
            aria-checked={autoOn}
            onClick={() =>
              onChange({
                ...settings,
                autoAssistThreshold: autoOn ? null : 72,
              })
            }
            className={`relative inline-flex min-h-[44px] min-w-[52px] shrink-0 items-center rounded-full transition [touch-action:manipulation] ${
              autoOn ? "bg-sky-500" : "bg-neutral-700"
            }`}
          >
            <span
              className={`pointer-events-none absolute left-1 top-1 inline-block h-6 w-6 rounded-full bg-white transition ${
                autoOn ? "translate-x-[20px]" : ""
              }`}
            />
          </button>
          <span className="text-sm leading-snug text-neutral-200">Assist on hot matches</span>
        </div>

        <div className={`mt-4 ${autoOn ? "opacity-100" : "pointer-events-none opacity-40"}`}>
          <label className="text-xs uppercase tracking-wide text-neutral-600">
            Match threshold ({th}% +)
            <input
              type="range"
              min={45}
              max={92}
              value={autoOn ? th : 72}
              onChange={(e) =>
                onChange({
                  ...settings,
                  autoAssistThreshold: Number(e.target.value),
                })
              }
              className="mt-2 block w-full accent-sky-500 py-2 [touch-action:manipulation]"
            />
          </label>
        </div>

        <div className="mt-5 flex items-center gap-3 py-1">
          <button
            type="button"
            role="switch"
            aria-checked={settings.openApplyTabs}
            onClick={() => onChange({ ...settings, openApplyTabs: !settings.openApplyTabs })}
            className={`relative inline-flex min-h-[44px] min-w-[52px] shrink-0 items-center rounded-full transition [touch-action:manipulation] ${
              settings.openApplyTabs ? "bg-sky-500" : "bg-neutral-700"
            }`}
          >
            <span
              className={`pointer-events-none absolute left-1 top-1 inline-block h-6 w-6 rounded-full bg-white transition ${
                settings.openApplyTabs ? "translate-x-[20px]" : ""
              }`}
            />
          </button>
          <span className="text-sm leading-snug text-neutral-200">Auto-open ATS / apply URLs</span>
        </div>
      </div>

      <div className="rounded-2xl border border-neutral-800 bg-black p-4">
        <h3 className="text-sm font-bold text-neutral-200">Targeting</h3>
        <ul className="mt-3 flex flex-wrap gap-1.5 text-[13px] text-sky-300/90">
          {["UX Lead", "Product design", "Design systems", "WCAG", "Travel/Hospitality", "Enterprise"].map((t) => (
            <li key={t} className="rounded-full bg-neutral-950 px-2 py-0.5">
              {t}
            </li>
          ))}
        </ul>
        <p className="mt-3 text-[13px] text-neutral-600">
          Weights derive from Chad’s résumé: Expedia UX III, underwriting platform UX, research-led
          iteration, tooling (Figma, GA, Cursor, GH).
        </p>
      </div>

      <div className="rounded-2xl border border-neutral-800 bg-black p-4">
        <h3 className="text-sm font-bold text-neutral-200">Live sources</h3>
        <p className="mt-2 text-[13px] leading-snug text-neutral-500">
          Postings hydrate from the&nbsp;
          <a
            className="text-sky-400 underline-offset-2 hover:underline"
            href="https://arbeitnow.com"
            target="_blank"
            rel="noreferrer noopener"
          >
            Arbeitnow
          </a>
          &nbsp;JSON feed,&nbsp;
          <a
            className="text-sky-400 underline-offset-2 hover:underline"
            href="https://remotive.com/api-documentation"
            target="_blank"
            rel="noreferrer noopener"
          >
            Remotive&apos;s open API
          </a>
          , and&nbsp;
          <a
            className="text-sky-400 underline-offset-2 hover:underline"
            href="https://remoteok.com/api"
            target="_blank"
            rel="noreferrer noopener"
          >
            Remote OK&apos;s JSON API
          </a>
          , plus the&nbsp;
          <a
            className="text-sky-400 underline-offset-2 hover:underline"
            href="https://jobicy.com/"
            target="_blank"
            rel="noreferrer noopener"
          >
            Jobicy
          </a>
          &nbsp;remote JSON bundle (crediting Jobicy in-listing URLs). Optional&nbsp;
          <a
            className="text-sky-400 underline-offset-2 hover:underline"
            href="https://www.indeed.com/intl/en_US/terms"
            target="_blank"
            rel="noreferrer noopener"
          >
            Indeed
          </a>
          &nbsp;results load only when you deploy the included Cloudflare Worker proxy and configure the
          <span className="mx-1 break-all font-mono text-[11px] text-neutral-600">VITE_INDEED_PROXY_URL</span>
          build variable to that URL (Publisher IDs never ship inside the SPA). LinkedIn postings have no sanctioned
          public-search API suitable for hobby job boards—only partner programs qualify.
        </p>
        <p className="mt-2 text-[12px] text-neutral-700">
          Listing URLs point back to each board—follow each provider&apos;s linking and attribution rules.
        </p>
      </div>
    </div>
  );
}
