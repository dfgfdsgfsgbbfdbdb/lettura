import { useTranslation } from "react-i18next";
import { FileSearch } from "lucide-react";
import { Button } from "@radix-ui/themes";
import { ArticleResItem, FeedResItem } from "@/db";
import { RouteConfig } from "@/config";
import type { SignalSearchResult, TopicSearchResult } from "./types";
import { SearchResultCard } from "./utils";

interface SearchResultsProps {
  resultList: ArticleResItem[];
  signalResults: SignalSearchResult[];
  topicResults: TopicSearchResult[];
  isFetching: boolean;
  hasMore: boolean;
  query: string;
  selectedFeed: FeedResItem | undefined;
  onLoadMore: () => void;
  onOpenArticle: (article: ArticleResItem) => void;
  onNavigateToToday: () => void;
  onNavigateToTopic: (uuid: string) => void;
}

export function SearchResults({
  resultList,
  signalResults,
  topicResults,
  isFetching,
  hasMore,
  query,
  selectedFeed,
  onLoadMore,
  onOpenArticle,
  onNavigateToToday,
  onNavigateToTopic,
}: SearchResultsProps) {
  const { t } = useTranslation();

  return (
    <div className="flex-1 overflow-auto p-5">
      <div className="mb-3 flex items-center justify-between text-xs text-[var(--gray-10)]">
        <span>
          {resultList.length > 0
            ? t("search.result_count", { count: resultList.length })
            : query
              ? t("search.hint_enter")
              : t("search.hint_type")}
        </span>
        {selectedFeed && <span>{t("search.source_label", { title: selectedFeed.title })}</span>}
      </div>

      {signalResults.length > 0 && (
        <div className="mb-4">
          <div className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-[var(--gray-10)]">
            {t("search.section.signals")}
          </div>
          <div className="grid gap-2">
            {signalResults.map((signal, i) => (
              <div
                key={i}
                className="rounded-lg border border-[var(--gray-5)] bg-[var(--color-panel-solid)] p-3 cursor-pointer transition-colors hover:border-[var(--gray-7)] hover:bg-[var(--gray-a2)]"
                onClick={onNavigateToToday}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-[var(--gray-12)]">{signal.signal_title}</span>
                  <span className="text-xs text-[var(--gray-9)]">{signal.article_count} articles · {signal.source_count} sources</span>
                </div>
                {signal.summary && (
                  <p className="text-xs text-[var(--gray-10)] line-clamp-2">{signal.summary}</p>
                )}
                {signal.topic_title && (
                  <span className="mt-1 inline-block text-[10px] px-1.5 py-0.5 rounded bg-[var(--accent-a3)] text-[var(--accent-11)]">
                    {signal.topic_title}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {topicResults.length > 0 && (
        <div className="mb-4">
          <div className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-[var(--gray-10)]">
            {t("search.section.topics")}
          </div>
          <div className="grid gap-2">
            {topicResults.map((topic) => (
              <div
                key={topic.uuid}
                className="rounded-lg border border-[var(--gray-5)] bg-[var(--color-panel-solid)] p-3 cursor-pointer transition-colors hover:border-[var(--gray-7)] hover:bg-[var(--gray-a2)]"
                onClick={() => onNavigateToTopic(topic.uuid)}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-[var(--gray-12)]">{topic.title}</span>
                  <span className="text-xs text-[var(--gray-9)]">{topic.article_count} articles · {topic.source_count} sources</span>
                </div>
                {topic.description && (
                  <p className="text-xs text-[var(--gray-10)] line-clamp-2">{topic.description}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {resultList.length === 0 && isFetching ? (
        <div className="grid gap-3">
          {[0, 1, 2].map((item) => (
            <div
              key={item}
              className="rounded-lg border border-[var(--gray-5)] bg-[var(--color-panel-solid)] p-4"
            >
              <div className="mb-3 h-3 w-32 rounded bg-[var(--gray-a4)]" />
              <div className="mb-2 h-4 w-3/4 rounded bg-[var(--gray-a4)]" />
              <div className="h-3 w-full rounded bg-[var(--gray-a3)]" />
            </div>
          ))}
        </div>
      ) : resultList.length === 0 ? (
        <div className="flex min-h-[360px] flex-col items-center justify-center rounded-lg border border-dashed border-[var(--gray-6)] bg-[var(--gray-a2)] p-8 text-center">
          <FileSearch
            size={38}
            strokeWidth={1.5}
            className="text-[var(--gray-9)]"
          />
          <h2 className="mt-4 text-base font-semibold text-[var(--gray-12)]">
            {t("search.empty.title")}
          </h2>
          <p className="mt-2 max-w-[360px] text-sm leading-6 text-[var(--gray-10)]">
            {t("search.empty.subtitle")}
          </p>
        </div>
      ) : (
        <div className="grid gap-3">
          {resultList.map((article) => (
            <SearchResultCard
              key={article.uuid}
              article={article}
              query={query}
              onOpen={onOpenArticle}
            />
          ))}
          {hasMore && (
            <Button
              variant="surface"
              color="gray"
              loading={isFetching}
              onClick={onLoadMore}
            >
              {t("search.load_more")}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
