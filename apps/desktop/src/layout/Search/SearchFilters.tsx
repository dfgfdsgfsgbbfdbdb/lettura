import { useTranslation } from "react-i18next";
import {
  Bookmark,
  Filter,
  Search,
  Sparkles,
  Star,
  X,
} from "lucide-react";
import { Button, IconButton, TextField } from "@radix-ui/themes";
import { ArticleResItem, FeedResItem } from "@/db";
import { SearchChip } from "./utils";

interface SearchFiltersProps {
  query: string;
  onQueryChange: (q: string) => void;
  onSearch: () => void;
  onSaveSearch: () => void;
  isStarred: boolean;
  highSignal: boolean;
  onResetFilters: () => void;
  onToggleStarred: () => void;
  onToggleHighSignal: () => void;
  startDate: string;
  endDate: string;
  feedUuid: string;
  feeds: FeedResItem[];
  onStartDateChange: (v: string) => void;
  onEndDateChange: (v: string) => void;
  onFeedChange: (v: string) => void;
  hasActiveFilters: boolean;
  currentArticle: ArticleResItem | null;
  onCloseArticle: () => void;
  onClearQuery: () => void;
}

export function SearchFilters({
  query,
  onQueryChange,
  onSearch,
  onSaveSearch,
  isStarred,
  highSignal,
  onResetFilters,
  onToggleStarred,
  onToggleHighSignal,
  startDate,
  endDate,
  feedUuid,
  feeds,
  onStartDateChange,
  onEndDateChange,
  onFeedChange,
  hasActiveFilters,
  currentArticle,
  onCloseArticle,
  onClearQuery,
}: SearchFiltersProps) {
  const { t } = useTranslation();

  return (
    <div className="border-b border-[var(--gray-5)] p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-[var(--gray-12)]">
            Search
          </h1>
          <p className="mt-1 text-sm text-[var(--gray-10)]">
            {t("search.header.subtitle")}
          </p>
        </div>
        {currentArticle && (
          <IconButton
            variant="ghost"
            color="gray"
            onClick={onCloseArticle}
          >
            <X size={16} />
          </IconButton>
        )}
      </div>
      <div className="mt-4 flex gap-2">
        <TextField.Root
          className="flex-1"
          size="3"
          value={query}
          placeholder="Search content in your Lettura"
          onChange={(event) => onQueryChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") onSearch();
          }}
        >
          <TextField.Slot>
            <Search size={16} />
          </TextField.Slot>
          {query && (
            <TextField.Slot>
              <IconButton
                size="1"
                variant="ghost"
                onClick={onClearQuery}
              >
                <X size={14} />
              </IconButton>
            </TextField.Slot>
          )}
        </TextField.Root>
        <Button size="3" onClick={onSearch} disabled={!query.trim()}>
          {t("search.button")}
        </Button>
        <IconButton
          size="3"
          variant="outline"
          color="gray"
          disabled={!query.trim()}
          onClick={onSaveSearch}
          title={t("search.save_search")}
        >
          <Star size={16} />
        </IconButton>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <SearchChip
          active={!isStarred && !highSignal}
          onClick={onResetFilters}
        >
          {t("search.filter.all")}
        </SearchChip>
        <SearchChip
          active={isStarred}
          onClick={onToggleStarred}
        >
          <Bookmark size={12} />
          {t("search.filter.starred")}
        </SearchChip>
        <SearchChip
          active={highSignal}
          onClick={onToggleHighSignal}
        >
          <Sparkles size={12} />
          {t("search.filter.high_signal")}
        </SearchChip>
        <SearchChip active={hasActiveFilters}>
          <Filter size={12} />
          {t("search.filter.advanced")}
        </SearchChip>
        <div className="ml-auto flex items-center gap-2">
          <input
            type="date"
            value={startDate}
            onChange={(event) => onStartDateChange(event.target.value)}
            className="h-8 rounded-md border border-[var(--gray-5)] bg-transparent px-2 text-xs text-[var(--gray-11)]"
          />
          <input
            type="date"
            value={endDate}
            onChange={(event) => onEndDateChange(event.target.value)}
            className="h-8 rounded-md border border-[var(--gray-5)] bg-transparent px-2 text-xs text-[var(--gray-11)]"
          />
          <select
            value={feedUuid}
            onChange={(event) => onFeedChange(event.target.value)}
            className="h-8 max-w-[160px] rounded-md border border-[var(--gray-5)] bg-transparent px-2 text-xs text-[var(--gray-11)]"
          >
            <option value="">{t("search.filter.all_sources")}</option>
            {feeds.map((feed) => (
              <option key={feed.uuid} value={feed.uuid}>
                {feed.title}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
