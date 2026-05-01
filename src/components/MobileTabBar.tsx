import type { ReactNode } from "react";
import { IconBolt, IconCheck, IconHome } from "./Icons";

export type MobileNavTab = "feed" | "applied" | "matches";

export function MobileTabBar({
  tab,
  onTab,
}: {
  tab: MobileNavTab;
  onTab: (t: MobileNavTab) => void;
}) {
  const Item = ({
    id,
    label,
    icon,
  }: {
    id: MobileNavTab;
    label: string;
    icon: ReactNode;
  }) => {
    const active = tab === id;
    return (
      <button
        type="button"
        onClick={() => onTab(id)}
        className={`flex min-h-[48px] min-w-[52px] flex-1 flex-col items-center justify-center gap-0.5 rounded-xl px-1 py-2 transition-colors [-webkit-tap-highlight-color:transparent] [touch-action:manipulation] ${
          active ? "bg-neutral-900 text-sky-400" : "text-neutral-500 active:bg-neutral-900/80"
        }`}
      >
        <span className="[&>svg]:h-6 [&>svg]:w-6">{icon}</span>
        <span
          className={`max-w-[4.75rem] truncate text-[11px] font-medium ${active ? "font-semibold text-sky-300" : ""}`}
        >
          {label}
        </span>
      </button>
    );
  };

  return (
    <nav
      aria-label="Primary"
      className="fixed bottom-0 left-0 right-0 z-30 border-t border-neutral-800 bg-black/94 backdrop-blur-md lg:hidden"
    >
      <div className="mx-auto flex max-w-lg justify-around pb-[calc(0.35rem+env(safe-area-inset-bottom))] pt-1.5">
        <Item id="feed" label="Home" icon={<IconHome />} />
        <Item id="matches" label="Strong" icon={<IconBolt />} />
        <Item id="applied" label="Applied" icon={<IconCheck />} />
      </div>
    </nav>
  );
}
