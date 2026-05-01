import type { BoardSettings } from "../lib/storage";
import { BoardSettingsPanels } from "./BoardSettingsPanels";

export function RightRail({
  settings,
  onChange,
}: {
  settings: BoardSettings;
  onChange: (s: BoardSettings) => void;
}) {
  return (
    <aside className="sticky top-0 hidden h-svh max-h-[100dvh] w-[320px] shrink-0 overflow-y-auto xl:flex xl:w-[350px] xl:flex-col">
      <div className="px-4 py-3 sm:px-6">
        <BoardSettingsPanels settings={settings} onChange={onChange} />
      </div>
    </aside>
  );
}
