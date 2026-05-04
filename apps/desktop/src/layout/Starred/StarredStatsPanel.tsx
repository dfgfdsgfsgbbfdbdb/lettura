import { useTranslation } from "react-i18next";
import { Archive, Bookmark } from "lucide-react";
import { ArticleResItem } from "@/db";
import { CollectionSuggestion } from "./CollectionSuggestion";

interface StarredStatsPanelProps {
  articles: ArticleResItem[];
  feedCount: number;
  withNotesCount: number;
  suggestion: { collectionName: string; articleCount: number } | null;
  onOpenArticle: (article: ArticleResItem) => void;
  onCreateCollection: (name: string) => Promise<void>;
}

export function StarredStatsPanel({
  articles,
  feedCount,
  withNotesCount,
  suggestion,
  onOpenArticle,
  onCreateCollection,
}: StarredStatsPanelProps) {
  const { t } = useTranslation();

  return (
    <aside className="hidden w-[280px] shrink-0 overflow-auto border-l border-[var(--gray-5)] bg-[var(--gray-2)] p-4 lg:block">
      <div className="mb-5">
        <div className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-[var(--gray-10)]">
          {t("starred.stats.title")}
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-lg border border-[var(--gray-5)] bg-[var(--color-panel-solid)] p-3">
            <div className="text-2xl font-bold text-[var(--gray-12)]">
              {articles.length}
            </div>
            <div className="text-xs text-[var(--gray-10)]">
              {t("starred.stats.all")}
            </div>
          </div>
          <div className="rounded-lg border border-[var(--gray-5)] bg-[var(--color-panel-solid)] p-3">
            <div className="text-2xl font-bold text-[var(--accent-11)]">
              {feedCount}
            </div>
            <div className="text-xs text-[var(--gray-10)]">
              {t("starred.stats.sources")}
            </div>
          </div>
        </div>
      </div>

      <CollectionSuggestion
        suggestion={suggestion}
        withNotesCount={withNotesCount}
        onCreateCollection={onCreateCollection}
      />

      <div>
        <div className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-[var(--gray-10)]">
          {t("starred.queue.title")}
        </div>
        {articles.slice(0, 3).map((article) => (
          <button
            type="button"
            key={article.uuid}
            onClick={() => onOpenArticle(article)}
            className="mb-2 flex w-full items-start gap-2 rounded-md bg-[var(--gray-a2)] px-2 py-2 text-left text-xs text-[var(--gray-11)] hover:bg-[var(--gray-a3)]"
          >
            <Bookmark size={13} className="mt-0.5 shrink-0" />
            <span className="line-clamp-2">{article.title}</span>
          </button>
        ))}
        {articles.length === 0 && (
          <div className="rounded-md bg-[var(--gray-a2)] px-3 py-3 text-xs leading-5 text-[var(--gray-10)]">
            <Archive size={14} className="mb-2" />
            {t("starred.queue.empty")}
          </div>
        )}
      </div>
    </aside>
  );
}
