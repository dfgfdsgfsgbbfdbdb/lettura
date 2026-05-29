import React, { useMemo } from "react";
import { Plus } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useShallow } from "zustand/react/shallow";
import { useBearStore } from "@/stores";

export const FeedsSidebar = React.memo(function FeedsSidebar() {
  const { t } = useTranslation();
  const store = useBearStore(
    useShallow((state) => ({
      subscribes: state.subscribes,
      folderFilter: state.folderFilter,
      setFolderFilter: state.setFolderFilter,
      setAddFeedModalOpen: state.setAddFeedModalOpen,
    })),
  );

  const { subscribes, folderFilter, setFolderFilter, setAddFeedModalOpen } = store;

  const folders = useMemo(
    () => subscribes.filter((s) => s.item_type === "folder"),
    [subscribes],
  );

  const totalFeeds = useMemo(
    () =>
      subscribes.reduce<number>((acc, s) => {
        if (s.item_type === "folder") return acc + (s.children?.length ?? 0);
        return acc + 1;
      }, 0),
    [subscribes],
  );

  const healthSummary = useMemo(() => {
    const feeds = subscribes.flatMap((s) =>
      s.item_type === "folder" ? s.children || [] : [s],
    );
    let healthy = 0;
    let error = 0;
    feeds.forEach((f) => {
      if (f.health_status === 1) error++;
      else healthy++;
    });
    return { healthy, error };
  }, [subscribes]);

  const ungroupedCount = useMemo(
    () => subscribes.filter((s) => s.item_type !== "folder" && !s.folder_uuid).length,
    [subscribes],
  );

  const filterBtnClass = (active: boolean) =>
    active
      ? "flex items-center gap-2 px-3.5 py-1.5 text-xs rounded-md bg-[var(--workbench-accent-soft)] text-[var(--workbench-accent-text)] cursor-pointer"
      : "flex items-center gap-2 px-3.5 py-1.5 text-xs rounded-md cursor-pointer hover:bg-[var(--workbench-accent-soft)] text-[var(--gray-11)]";

  return (
    <>
      <div className="mb-2 flex items-center justify-between">
        <span className="text-[10px] font-semibold uppercase tracking-wide text-[var(--gray-9)]">
          {t("feeds.sidebar.folders")}
        </span>
        <button
          type="button"
          onClick={() => setAddFeedModalOpen(true)}
          className="rounded p-0.5 text-[var(--gray-9)] hover:text-[var(--gray-11)]"
        >
          <Plus size={12} />
        </button>
      </div>

      <div className="grid gap-0.5">
        <button
          type="button"
          onClick={() => setFolderFilter(null)}
          className={filterBtnClass(folderFilter === null)}
        >
          <span className="w-2 h-2 rounded-full bg-[var(--green-9)]" />
          <span>{t("feeds.all_sources")}</span>
          <span className="ml-auto text-[10px] opacity-60">{totalFeeds}</span>
        </button>

        {folders.map((folder) => (
          <button
            type="button"
            key={folder.uuid}
            onClick={() => setFolderFilter(folder.uuid)}
            className={filterBtnClass(folderFilter === folder.uuid)}
          >
            <span>📁</span>
            <span className="truncate">{folder.title}</span>
            <span className="ml-auto text-[10px] opacity-60">
              {folder.children?.length ?? 0}
            </span>
          </button>
        ))}

        {ungroupedCount > 0 && (
          <button
            type="button"
            onClick={() => setFolderFilter("ungrouped")}
            className={filterBtnClass(folderFilter === "ungrouped")}
          >
            <span>📄</span>
            <span>{t("feeds.ungrouped")}</span>
            <span className="ml-auto text-[10px] opacity-60">{ungroupedCount}</span>
          </button>
        )}
      </div>

      <div className="border-t border-[var(--gray-5)] mt-3 pt-3">
        <div className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-[var(--gray-9)]">
          {t("feeds.health_overview")}
        </div>
        <div className="flex items-center gap-3 text-xs">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-[var(--green-9)]" />
            <span className="text-[var(--gray-11)]">{healthSummary.healthy}</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-[var(--red-9)]" />
            <span className="text-[var(--gray-11)]">{healthSummary.error}</span>
          </span>
        </div>
      </div>
    </>
  );
});
