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
      className={`group flex w-full items-center gap-4 rounded-full px-3 py-3 text-xl transition-colors hover:bg-neutral-900 ${
        tab === id ? "font-bold text-neutral-50" : "text-neutral-300"
      }`}
    >
      <span className="text-neutral-400 group-hover:text-neutral-50">
        {icon}
      </span>
      {label}
    </button>
  );

  return (
    <aside className="sticky top-0 flex h-screen w-[275px] flex-col border-r border-neutral-800 px-3 py-2">
      <div className="px-4 py-2">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-sky-500 to-indigo-600 text-xl font-black text-white">
          J
        </div>
      </div>

      <nav className="mt-4 flex flex-1 flex-col gap-0.5 pr-6">
        <NavBtn id="feed" label="Home" icon={<IconHome className="h-7 w-7" />} />
        <NavBtn
          id="matches"
          label="Strong matches"
          icon={<IconBolt className="h-7 w-7" />}
        />
        <NavBtn
          id="applied"
          label="Applied"
          icon={<IconCheck className="h-7 w-7" />}
        />
      </nav>

      <div className="mb-10 mt-auto rounded-full border border-neutral-800 px-4 py-3">
        <p className="truncate text-[15px] font-semibold text-neutral-50">
          {profile.name}
        </p>
        <p className="truncate text-sm text-neutral-500">@{profile.handle}</p>
      </div>
    </aside>
  );
}
