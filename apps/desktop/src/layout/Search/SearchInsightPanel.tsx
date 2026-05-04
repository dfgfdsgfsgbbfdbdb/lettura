import { useTranslation } from "react-i18next";
import { Bookmark, Calendar, Rss } from "lucide-react";
import type { TopicItem } from "@/stores/topicSlice";
import { SearchChip } from "./utils";

interface SearchInsightPanelProps {
  searchInsight: { summary: string; details: string[] } | null;
  relatedTopics: TopicItem[];
  isStarred: boolean;
  hasActiveFilters: boolean;
  onToggleStarred: () => void;
  onSetDateRange: (start: string, end: string) => void;
  onClearFilters: () => void;
}

export function SearchInsightPanel({
  searchInsight,
  relatedTopics,
  isStarred,
  hasActiveFilters,
  onToggleStarred,
  onSetDateRange,
  onClearFilters,
}: SearchInsightPanelProps) {
  const { t } = useTranslation();

  return (
    <aside className="hidden w-[280px] shrink-0 overflow-auto border-l border-[var(--gray-5)] bg-[var(--gray-2)] p-4 lg:block">
      <div className="mb-5">
        <div className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-[var(--gray-10)]">
          {t("search.insight.title")}
        </div>
        <div className="rounded-lg border border-[var(--gray-5)] bg-[var(--color-panel-solid)] p-3">
          {searchInsight ? (
            <>
              <div className="text-sm font-semibold text-[var(--gray-12)]">
                {searchInsight.summary}
              </div>
              {searchInsight.details.length > 0 && (
                <p className="mt-2 text-xs leading-5 text-[var(--gray-11)]">
                  {searchInsight.details.join("；")}
                </p>
              )}
            </>
          ) : (
            <>
              <div className="text-sm font-semibold text-[var(--gray-12)]">
                {t("search.insight.title_text")}
              </div>
              <p className="mt-2 text-xs leading-5 text-[var(--gray-11)]">
                {t("search.insight.description")}
              </p>
            </>
          )}
        </div>
      </div>
      <div className="mb-5">
        <div className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-[var(--gray-10)]">
          {t("search.quick_filter.title")}
        </div>
        <div className="grid gap-2">
          <SearchChip
            active={hasActiveFilters}
            onClick={() => {
              if (hasActiveFilters) {
                onClearFilters();
              } else {
                const now = new Date();
                const thirtyDaysAgo = new Date(
                  now.getTime() - 30 * 24 * 60 * 60 * 1000,
                );
                onSetDateRange(thirtyDaysAgo.toISOString().split("T")[0], now.toISOString().split("T")[0]);
              }
            }}
          >
            <Calendar size={12} />
            {t("search.quick_filter.last_30_days")}
          </SearchChip>
          <SearchChip>
            <Rss size={12} />
            {t("search.quick_filter.all_sources")}
          </SearchChip>
          <SearchChip
            active={isStarred}
            onClick={onToggleStarred}
          >
            <Bookmark size={12} />
            {t("search.quick_filter.starred_only")}
          </SearchChip>
        </div>
      </div>
      <div>
        <div className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-[var(--gray-10)]">
          {t("search.related_topics")}
        </div>
        {relatedTopics.length > 0 ? (
          relatedTopics.map((topic) => (
            <div
              key={topic.id}
              className="mb-2 flex items-center gap-2 rounded-md bg-[var(--gray-a2)] px-2 py-2 text-xs text-[var(--gray-11)]"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent-9)]" />
              {topic.title}
            </div>
          ))
        ) : (
          <div className="text-xs text-[var(--gray-9)]">
            {t("search.related_topics_empty")}
          </div>
        )}
      </div>
    </aside>
  );
}
