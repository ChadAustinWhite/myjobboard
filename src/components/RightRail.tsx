import type { BoardSettings } from "../lib/storage";

export function RightRail({
  settings,
  onChange,
}: {
  settings: BoardSettings;
  onChange: (s: BoardSettings) => void;
}) {
  const th = settings.autoAssistThreshold ?? 72;
  const autoOn = settings.autoAssistThreshold !== null;

  return (
    <aside className="sticky top-0 hidden h-screen w-[350px] shrink-0 xl:block">
      <div className="px-6 py-3">
        <div className="rounded-2xl border border-neutral-800 bg-black p-4">
          <h2 className="text-lg font-bold text-neutral-100">Auto-assist</h2>
          <p className="mt-1 text-[14px] leading-snug text-neutral-500">
            When a freshly ingested posting clears your threshold, your draft copies
            and the apply URL opens automatically (employer submits still manual).
          </p>

          <div className="mt-5 flex items-center gap-3">
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
              className={`relative h-8 w-[52px] rounded-full transition ${
                autoOn ? "bg-sky-500" : "bg-neutral-700"
              }`}
            >
              <span
                className={`absolute left-1 top-1 inline-block h-6 w-6 rounded-full bg-white transition ${
                  autoOn ? "translate-x-[20px]" : ""
                }`}
              />
            </button>
            <span className="text-sm text-neutral-200">Assist on hot matches</span>
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
                className="mt-2 block w-full accent-sky-500"
              />
            </label>
          </div>

          <div className="mt-5 flex items-center gap-3">
            <button
              type="button"
              role="switch"
              aria-checked={settings.openApplyTabs}
              onClick={() =>
                onChange({ ...settings, openApplyTabs: !settings.openApplyTabs })
              }
              className={`relative h-8 w-[52px] rounded-full transition ${
                settings.openApplyTabs ? "bg-sky-500" : "bg-neutral-700"
              }`}
            >
              <span
                className={`absolute left-1 top-1 inline-block h-6 w-6 rounded-full bg-white transition ${
                  settings.openApplyTabs ? "translate-x-[20px]" : ""
                }`}
              />
            </button>
            <span className="text-sm text-neutral-200">
              Auto-open ATS / apply URLs
            </span>
          </div>
        </div>

        <div className="mt-6 rounded-2xl border border-neutral-800 bg-black p-4">
          <h3 className="text-sm font-bold text-neutral-200">Targeting</h3>
          <ul className="mt-3 flex flex-wrap gap-1.5 text-[13px] text-sky-300/90">
            {[
              "UX Lead",
              "Product design",
              "Design systems",
              "WCAG",
              "Travel/Hospitality",
              "Enterprise",
            ].map((t) => (
              <li key={t} className="rounded-full bg-neutral-950 px-2 py-0.5">
                {t}
              </li>
            ))}
          </ul>
          <p className="mt-3 text-[13px] text-neutral-600">
            Weights derive from Chad’s résumé: Expedia UX III, underwriting platform UX,
            research-led iteration, tooling (Figma, GA, Cursor, GH).
          </p>
        </div>

        <div className="mt-6 rounded-2xl border border-neutral-800 bg-black p-4">
          <h3 className="text-sm font-bold text-neutral-200">Live sources</h3>
          <p className="mt-2 text-[13px] leading-snug text-neutral-500">
            Postings hydrate from the&nbsp;
            <a
              className="text-sky-400 hover:underline"
              href="https://arbeitnow.com"
              target="_blank"
              rel="noreferrer noopener"
            >
              Arbeitnow
            </a>
            &nbsp;JSON feed,&nbsp;
            <a
              className="text-sky-400 hover:underline"
              href="https://remotive.com/api-documentation"
              target="_blank"
              rel="noreferrer noopener"
            >
              Remotive&apos;s open API
            </a>
            , and&nbsp;
            <a
              className="text-sky-400 hover:underline"
              href="https://remoteok.com/api"
              target="_blank"
              rel="noreferrer noopener"
            >
              Remote OK&apos;s JSON API
            </a>
            . Roles are narrowed to postings that materially target the United States labour market plus
            distributed remote gigs that are not plainly EU/APAC-exclusive. Throttle refreshes—the public
            boards rate-limit abusive polling.
          </p>
          <p className="mt-2 text-[12px] text-neutral-700">
            Listing URLs point back to Remotive / Remote OK / Arbeitnow-hosted pages where their API terms
            require it.
          </p>
        </div>
      </div>
    </aside>
  );
}
