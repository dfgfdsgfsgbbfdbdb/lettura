import { useTranslation } from "react-i18next";
import { Tags } from "lucide-react";
import type { CollectionItem, TagItem } from "@/helpers/starredApi";

interface StarredSidebarProps {
  collections: CollectionItem[];
  tags: TagItem[];
  activeCollection: string | null;
  activeTag: string | null;
  onSelectCollection: (uuid: string | null) => void;
  onSelectTag: (uuid: string | null) => void;
  onSelectAll: () => void;
  totalArticles: number;
}

export function StarredSidebar({
  collections,
  tags,
  activeCollection,
  activeTag,
  onSelectCollection,
  onSelectTag,
  onSelectAll,
  totalArticles,
}: StarredSidebarProps) {
  const { t } = useTranslation();

  return (
    <aside className="hidden w-[220px] shrink-0 flex-col border-r border-[var(--gray-5)] bg-[var(--gray-2)] md:flex">
      <div className="border-b border-[var(--gray-5)] p-4">
        <div className="text-sm font-semibold text-[var(--gray-12)]">
          Starred
        </div>
        <div className="mt-1 text-xs leading-5 text-[var(--gray-10)]">
          {t("starred.subtitle")}
        </div>
      </div>
      <div className="flex-1 overflow-auto p-3">
        <div className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-[var(--gray-10)]">
          {t("starred.sidebar.collections")}
        </div>
        <button
          type="button"
          onClick={onSelectAll}
          className={
            activeCollection === null && activeTag === null
              ? "flex w-full items-center gap-2 rounded-md bg-[var(--gray-a3)] px-2 py-1.5 text-left text-xs font-medium text-[var(--gray-12)]"
              : "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs text-[var(--gray-11)] hover:bg-[var(--gray-a3)]"
          }
        >
          <span
            className="h-1.5 w-1.5 rounded-full"
            style={{ background: "var(--amber-9)" }}
          />
          <span>{t("starred.sidebar.all")}</span>
          <span className="ml-auto text-[10px] text-[var(--gray-9)]">
            {totalArticles}
          </span>
        </button>
        {collections.map((collection) => (
          <button
            type="button"
            key={collection.uuid}
            onClick={() => onSelectCollection(collection.uuid)}
            className={
              activeCollection === collection.uuid
                ? "flex w-full items-center gap-2 rounded-md bg-[var(--gray-a3)] px-2 py-1.5 text-left text-xs font-medium text-[var(--gray-12)]"
                : "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs text-[var(--gray-11)] hover:bg-[var(--gray-a3)]"
            }
          >
            <span
              className="h-1.5 w-1.5 rounded-full"
              style={{ background: "var(--accent-9)" }}
            />
            <span>{collection.name}</span>
          </button>
        ))}

        <div className="mb-2 mt-5 text-[10px] font-semibold uppercase tracking-wide text-[var(--gray-10)]">
          {t("starred.sidebar.tags")}
        </div>
        {tags.map((tag) => (
          <button
            type="button"
            key={tag.uuid}
            onClick={() => onSelectTag(tag.uuid)}
            className={
              activeTag === tag.uuid
                ? "flex w-full items-center gap-2 rounded-md bg-[var(--gray-a3)] px-2 py-1.5 text-left text-xs font-medium text-[var(--gray-12)]"
                : "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs text-[var(--gray-11)] hover:bg-[var(--gray-a3)]"
            }
          >
            <Tags size={12} />
            #{tag.name}
          </button>
        ))}
      </div>
    </aside>
  );
}
