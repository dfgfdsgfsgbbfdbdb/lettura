import { useState, useEffect } from "react";
import { Flex, Text, Popover } from "@radix-ui/themes";
import { useTranslation } from "react-i18next";
import { formatDistanceToNow, parseISO } from "date-fns";
import { PipelineStatus, FeedbackEntry } from "@/stores/createTodaySlice";
import { useBearStore } from "@/stores";
import { Loader2, Check, AlertTriangle, RefreshCw, MessageSquare, WifiOff } from "lucide-react";

interface TodayHeaderProps {
  pipelineStatus: PipelineStatus;
  lastUpdated: string | null;
  sourceCount: number;
  onRefresh: () => void;
  onRetry: () => void;
  pipelineError: string | null;
}

interface StatusPillProps {
  status: PipelineStatus;
  lastUpdated: string | null;
  sourceCount: number;
  onRefresh: () => void;
  onRetry: () => void;
  error: string | null;
}

function StatusPill({
  status,
  lastUpdated,
  sourceCount,
  onRefresh,
  onRetry,
  error,
}: StatusPillProps) {
  const { t } = useTranslation();

  if (status === "idle" && lastUpdated) {
    const timeAgo = formatDistanceToNow(parseISO(lastUpdated), { addSuffix: true });
    return (
      <Flex align="center" gap="2" className="text-xs rounded-full px-3 py-1 bg-[var(--gray-3)] text-[var(--gray-11)]">
        <Text size="1">{t("today.header.last_updated", { time: timeAgo })}</Text>
        <button onClick={onRefresh} className="hover:text-[var(--gray-12)] transition-colors">
          <RefreshCw size={12} />
        </button>
      </Flex>
    );
  }

  if (status === "running") {
    return (
      <Flex align="center" gap="2" className="text-xs rounded-full px-3 py-1 bg-[var(--gray-3)] text-[var(--gray-11)]">
        <Loader2 size={12} className="animate-spin" />
        <Text size="1">{t("today.header.analyzing")}</Text>
      </Flex>
    );
  }

  if (status === "done") {
    return (
      <Flex align="center" gap="2" className="text-xs rounded-full px-3 py-1 bg-[var(--gray-3)] text-[var(--gray-11)]">
        <Check size={12} className="text-[var(--green-9)]" />
        <Text size="1">{t("today.header.done", { count: sourceCount })}</Text>
      </Flex>
    );
  }

  if (status === "error") {
    return (
      <button
        onClick={onRetry}
        className="flex items-center gap-2 text-xs rounded-full px-3 py-1 bg-[var(--gray-3)] text-[var(--gray-11)] hover:text-[var(--gray-12)] transition-colors"
      >
        <AlertTriangle size={12} className="text-[var(--amber-9)]" />
        <Text size="1">{error || t("today.header.error_retry")}</Text>
      </button>
    );
  }

  return null;
}

export function TodayHeader({
  pipelineStatus,
  lastUpdated,
  sourceCount,
  onRefresh,
  onRetry,
  pipelineError,
}: TodayHeaderProps) {
  const { t } = useTranslation();

  if (pipelineStatus === "idle" && !lastUpdated) {
    return null;
  }

  return (
    <div className="flex items-center justify-between px-6 py-4">
      <div>
        <h1 className="text-xl font-semibold text-[var(--gray-12)]">{t("today.title")}</h1>
        <p className="text-sm text-[var(--gray-10)]">{t("today.subtitle")}</p>
      </div>
      <div className="flex items-center gap-3">
        <OfflineIndicator />
        <FeedbackHistoryPopover />
        <StatusPill
          status={pipelineStatus}
          lastUpdated={lastUpdated}
          sourceCount={sourceCount}
          onRefresh={onRefresh}
          onRetry={onRetry}
          error={pipelineError}
        />
      </div>
    </div>
  );
}

function FeedbackHistoryPopover() {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const store = useBearStore();

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (isOpen && store.feedbackHistory.length === 0) {
      store.fetchFeedbackHistory(20);
    }
  };

  const feedbackTypeLabel = (type: string) => {
    switch (type) {
      case "useful": return t("today.feedback.useful");
      case "not_relevant": return t("today.feedback.not_relevant");
      case "follow_topic": return t("today.feedback.follow_topic");
      default: return type;
    }
  };

  return (
    <Popover.Root open={open} onOpenChange={handleOpenChange}>
      <Popover.Trigger>
        <button
          className="flex items-center gap-1 text-xs text-[var(--gray-9)] hover:text-[var(--gray-11)] transition-colors"
          aria-label={t("today.feedback.history")}
        >
          <MessageSquare size={14} />
        </button>
      </Popover.Trigger>
      <Popover.Content width="320px" sideOffset={8} align="end">
        <div className="max-h-[300px] overflow-y-auto">
          <Text size="2" weight="medium" className="block mb-2">
            {t("today.feedback.history_title")}
          </Text>
          {store.feedbackHistory.length === 0 ? (
            <Text size="2" className="text-[var(--gray-9)]">
              {t("today.feedback.history_empty")}
            </Text>
          ) : (
            <div className="flex flex-col gap-1.5">
              {store.feedbackHistory.map((entry) => (
                <div key={entry.id} className="flex items-center justify-between text-xs py-1 border-b border-[var(--gray-4)] last:border-0">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className={`shrink-0 px-1.5 py-0.5 rounded text-[10px] font-medium ${
                      entry.feedback_type === "useful"
                        ? "bg-[var(--green-3)] text-[var(--green-9)]"
                        : entry.feedback_type === "not_relevant"
                          ? "bg-[var(--red-3)] text-[var(--red-9)]"
                          : "bg-[var(--accent-3)] text-[var(--accent-9)]"
                    }`}>
                      {feedbackTypeLabel(entry.feedback_type)}
                    </span>
                    <span className="text-[var(--gray-8)] truncate">
                      {t("today.feedback.history_signal", { id: entry.signal_id })}
                    </span>
                  </div>
                  <span className="text-[var(--gray-8)] shrink-0 ml-2">
                    {formatDistanceToNow(parseISO(entry.create_date), { addSuffix: true })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </Popover.Content>
    </Popover.Root>
  );
}

function OfflineIndicator() {
  const { t } = useTranslation();
  const [online, setOnline] = useState(navigator.onLine);

  useEffect(() => {
    const onOnline = () => setOnline(true);
    const onOffline = () => setOnline(false);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, []);

  if (online) return null;

  return (
    <div className="flex items-center gap-1 text-xs text-[var(--amber-9)]">
      <WifiOff size={12} />
      <span>{t("today.offline")}</span>
    </div>
  );
}
