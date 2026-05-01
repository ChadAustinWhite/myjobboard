import type { ReactNode } from "react";
import { profile } from "../data/profile";
import {
  IconBolt,
  IconCheck,
  IconHome,
} from "./Icons";

export function Sidebar({
  tab,
  onTab,
}: {
  tab: "feed" | "applied" | "matches";
  onTab: (t: "feed" | "applied" | "matches") => void;
}) {
  const NavBtn = ({
    id,
    label,
    icon,
  }: {
    id: typeof tab;
    label: string;
    icon: ReactNode;
  }) => (
    <button
      type="button"
      onClick={() => onTab(id)}
      className={`group flex w-full items-center gap-3 rounded-full px-3 py-2.5 text-lg transition-colors [touch-action:manipulation] hover:bg-neutral-900 xl:gap-4 xl:py-3 xl:text-xl ${
        tab === id ? "font-bold text-neutral-50" : "text-neutral-300"
      }`}
    >
      <span className="text-neutral-400 group-hover:text-neutral-50 xl:[&>svg]:h-7 xl:[&>svg]:w-7">
        {icon}
      </span>
      <span className="truncate xl:max-w-none">{label}</span>
    </button>
  );

  const initials = profile.name
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <aside className="sticky top-0 hidden h-svh max-h-[100dvh] w-[220px] shrink-0 flex-col border-r border-neutral-800 px-3 py-2 lg:flex xl:w-[275px]">
      <div className="px-4 py-2">
        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-sky-500 to-indigo-600 text-[15px] font-black text-white">
          {initials}
        </div>
      </div>

      <nav className="mt-4 flex flex-1 flex-col gap-0.5 pr-6">
        <NavBtn id="feed" label="Home" icon={<IconHome className="h-6 w-6 xl:h-7 xl:w-7" />} />
        <NavBtn
          id="matches"
          label="Strong matches"
          icon={<IconBolt className="h-6 w-6 xl:h-7 xl:w-7" />}
        />
        <NavBtn
          id="applied"
          label="Applied"
          icon={<IconCheck className="h-6 w-6 xl:h-7 xl:w-7" />}
        />
      </nav>

      <div className="mb-8 mt-auto rounded-full border border-neutral-800 px-3 py-2.5">
        <p className="truncate text-[15px] font-semibold text-neutral-50">
          {profile.name}
        </p>
        <p className="truncate text-sm text-neutral-500">@{profile.handle}</p>
      </div>
    </aside>
  );
}
