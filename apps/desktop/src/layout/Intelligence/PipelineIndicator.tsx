import { Button, Flex, Text } from "@radix-ui/themes";
import { useTranslation } from "react-i18next";
import { PipelineStatus } from "@/stores/createTodaySlice";
import { Loader2, Check, AlertTriangle, RefreshCw } from "lucide-react";

const STAGE_LABEL_MAP: Record<string, string> = {
  fetching_articles: "today.pipeline.stage_syncing",
  generating_embeddings: "today.pipeline.stage_analyzing",
  deduplicating: "today.pipeline.stage_analyzing",
  clustering: "today.pipeline.stage_analyzing",
  generating_signal_titles: "today.pipeline.stage_generating",
  creating_topics: "today.pipeline.stage_topic",
  generating_topic_summaries: "today.pipeline.stage_summary",
  generating_summaries: "today.pipeline.stage_analyzing",
  grouping_topics: "today.pipeline.stage_topic",
  ranking: "today.pipeline.stage_ranking",
  generating_wim: "today.pipeline.stage_explaining",
  storing_results: "today.pipeline.stage_analyzing",
};

interface PipelineIndicatorProps {
  status: PipelineStatus;
  stage?: string | null;
  progress?: number;
  error?: string | null;
  onRetry?: () => void;
  onTrigger?: () => void;
  lastUpdated?: string | null;
  compact?: boolean;
}

export function PipelineIndicator({
  status,
  stage,
  progress,
  error,
  onRetry,
  onTrigger,
  lastUpdated,
  compact = false,
}: PipelineIndicatorProps) {
  const { t } = useTranslation();

  if (status === "idle") {
    if (!onTrigger) return null;
    return (
      <Flex align="center" gap="2" className={compact ? "py-1" : "px-4 py-2"}>
        <button
          onClick={() => onTrigger()}
          className="flex items-center gap-1 px-2 py-1 text-[11px] text-[var(--gray-11)] hover:text-[var(--gray-12)] border border-[var(--gray-4)] rounded-md hover:border-[var(--gray-6)] transition-colors"
        >
          <RefreshCw size={12} />
          {t("today.pipeline.refresh")}
        </button>
        {lastUpdated && (
          <Text size="1" className="text-[var(--gray-8)]">
            {t("today.pipeline.last_updated", { time: new Date(lastUpdated).toLocaleTimeString() })}
          </Text>
        )}
      </Flex>
    );
  }

  if (status === "running") {
    return (
      <Flex align="center" gap="2" className={compact ? "py-1 px-3" : "px-4 py-2"}>
        <Loader2 size={16} className="animate-spin text-[var(--accent-9)]" />
        <Text size="1" className="text-[var(--gray-11)]">
          {t("today.pipeline.running")}
        </Text>
        {stage && (
          <Text size="1" className="text-[var(--gray-9)]">
            ({t(STAGE_LABEL_MAP[stage] || "today.pipeline.stage_analyzing")}
            {progress !== undefined && progress > 0
              ? ` ${Math.round(progress * 100)}%`
              : ""}
            )
          </Text>
        )}
      </Flex>
    );
  }

  if (status === "done") {
    return (
      <Flex align="center" gap="2" className={compact ? "py-1 px-3" : "px-4 py-2"}>
        <Check size={16} className="text-[var(--green-9)]" />
        <Text size="1" className="text-[var(--green-9)]">
          {t("today.pipeline.done")}
        </Text>
      </Flex>
    );
  }

  if (status === "error") {
    return (
      <Flex direction="column" gap="1" className={compact ? "py-1 px-3" : "px-4 py-2"}>
        <Flex align="center" gap="2">
          <AlertTriangle size={16} className="text-[var(--amber-9)]" />
          <Text size="1" className="text-[var(--amber-9)]">
            {t("today.pipeline.error")}
          </Text>
          {onRetry && (
            <Button size="1" variant="ghost" onClick={() => onRetry()}>
              {t("today.pipeline.retry")}
            </Button>
          )}
        </Flex>
        {error && (
          <Text size="1" className="text-[var(--gray-9)] pl-6">
            {error}
          </Text>
        )}
      </Flex>
    );
  }

  return null;
}
