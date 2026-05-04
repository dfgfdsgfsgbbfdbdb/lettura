import { useEffect, useCallback } from "react";
import { Flex, Text, Button } from "@radix-ui/themes";
import { useBearStore } from "@/stores";
import { useShallow } from "zustand/react/shallow";
import { useTranslation } from "react-i18next";
import { SignalList } from "./SignalList";
import { PipelineIndicator } from "./PipelineIndicator";
import { TodayHeader } from "./TodayHeader";
import { TodayOverview } from "./TodayOverview";
import { TodayEmptyState } from "./TodayEmptyState";
import { Settings, Sparkles, Loader2 } from "lucide-react";

export function TodayContent() {
  const { t } = useTranslation();
  const store = useBearStore(
    useShallow((state) => ({
      signals: state.signals,
      signalsLoading: state.signalsLoading,
      signalsError: state.signalsError,
      aiConfig: state.aiConfig,
      subscribes: state.subscribes,
      fetchSignals: state.fetchSignals,
      triggerPipeline: state.triggerPipeline,
      updateSettingDialogStatus: state.updateSettingDialogStatus,
      overview: state.overview,
      overviewLoading: state.overviewLoading,
      overviewError: state.overviewError,
      expandedSignalId: state.expandedSignalId,
      activeReadingSignalId: state.activeReadingSignalId,
      activeReadingSourceIndex: state.activeReadingSourceIndex,
      pipelineStatus: state.pipelineStatus,
      pipelineStage: state.pipelineStage,
      pipelineProgress: state.pipelineProgress,
      pipelineError: state.pipelineError,
      lastUpdated: state.lastUpdated,
      startInlineReading: state.startInlineReading,
      signalDetails: state.signalDetails,
      openSourceArticle: state.openSourceArticle,
      scrollPositionMap: state.scrollPositionMap,
    })),
  );

  useEffect(() => {
    const signalId = store.expandedSignalId;
    if (signalId != null && store.scrollPositionMap[signalId] !== undefined) {
      requestAnimationFrame(() => {
        const scrollContainer = document.querySelector(
          "[data-today-scroll]",
        ) as HTMLElement | null;
        if (scrollContainer) {
          scrollContainer.scrollTop = store.scrollPositionMap[signalId];
        }
      });
    }
  }, []);

  const hasApiKey = store.aiConfig?.has_api_key ?? false;
  const hasSignals = store.signals.length > 0;
  const hasSubscriptions = store.subscribes.length > 0;

  const handleInlineRead = useCallback(
    (articleUuid: string, feedUuid: string, articleId: number) => {
      const signal = store.signals.find((s) =>
        s.sources.some((src) => src.article_id === articleId),
      );
      if (!signal) return;

      const detail = store.signalDetails[signal.id];
      const sources = detail?.all_sources ?? signal.sources;
      const sourceIndex = sources.findIndex((s) => s.article_id === articleId);

      store.startInlineReading(signal.id, sourceIndex >= 0 ? sourceIndex : 0);

      const source = sources[sourceIndex];
      if (source) {
        store.openSourceArticle(source);
      }
    },
    [
      store.signals,
      store.signalDetails,
      store.startInlineReading,
      store.openSourceArticle,
    ],
  );

  const renderEmptyState = () => {
    if (!hasSubscriptions) {
      return <TodayEmptyState type="no_subscriptions" />;
    }

    if (!hasApiKey) {
      return (
        <div className="flex flex-col items-center justify-center py-20 text-center h-full">
          <div className="mb-4">
            <Settings size={48} className="text-[var(--gray-6)]" />
          </div>
          <Text size="5" weight="medium" className="mb-2 text-[var(--gray-12)]">
            {t("today.empty.no_api_key")}
          </Text>
          <Button
            size="3"
            onClick={() => store.updateSettingDialogStatus(true)}
          >
            {t("today.empty.go_to_settings")}
          </Button>
        </div>
      );
    }

    if (!hasSignals) {
      return (
        <div className="flex flex-col items-center justify-center py-20 text-center h-full">
          <div className="mb-4">
            <Sparkles size={48} className="text-[var(--gray-6)]" />
          </div>
          <Text size="5" weight="medium" className="mb-2 text-[var(--gray-12)]">
            {t("today.empty.no_signals")}
          </Text>
          <Button size="3" onClick={() => store.triggerPipeline()}>
            {t("today.empty.start_analysis")}
          </Button>
        </div>
      );
    }

    return <TodayEmptyState type="no_new_articles" />;
  };

  return (
    <div className="flex-1 flex flex-col min-w-0 h-full">
      <TodayHeader
        pipelineStatus={store.pipelineStatus}
        lastUpdated={store.lastUpdated}
        sourceCount={store.overview?.article_count ?? 0}
        onRefresh={() => store.triggerPipeline()}
        onRetry={() => store.triggerPipeline()}
        pipelineError={store.pipelineError}
      />
      <PipelineIndicator
        status={store.pipelineStatus}
        stage={store.pipelineStage}
        progress={store.pipelineProgress}
        error={store.pipelineError}
        onRetry={() => store.triggerPipeline()}
        onTrigger={() => store.triggerPipeline()}
        lastUpdated={store.lastUpdated}
      />

      {store.signalsError ? (
        <TodayEmptyState
          type="load_error"
          onRetry={() => store.fetchSignals()}
        />
      ) : store.signalsLoading && !hasSignals ? (
        <Flex align="center" justify="center" className="flex-1">
          <Loader2 className="animate-spin text-[var(--gray-8)]" size={32} />
        </Flex>
      ) : !hasApiKey || !hasSignals ? (
        renderEmptyState()
      ) : (
        <div className="flex-1 overflow-auto px-6 py-5" data-today-scroll>
          <TodayOverview
            overview={store.overview}
            overviewLoading={store.overviewLoading}
            overviewError={store.overviewError}
            hasApiKey={hasApiKey}
          />
          <SignalList
            signals={store.signals}
            activeReadingSignalId={store.activeReadingSignalId}
            activeReadingSourceIndex={store.activeReadingSourceIndex}
            onInlineRead={handleInlineRead}
          />
        </div>
      )}
    </div>
  );
}
