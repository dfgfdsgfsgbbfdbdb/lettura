import { useEffect } from "react";
import { useBearStore } from "@/stores";
import { useShallow } from "zustand/react/shallow";
import { TodayContent } from "./TodayContent";
import { TodayRightPanel } from "./TodayRightPanel";

export function TodayPage() {
  const store = useBearStore(
    useShallow((state) => ({
      fetchAIConfig: state.fetchAIConfig,
      fetchSignals: state.fetchSignals,
      fetchOverview: state.fetchOverview,
      signals: state.signals,
      isInlineReading: state.isInlineReading,
    })),
  );

  useEffect(() => {
    store.fetchAIConfig();
    store.fetchSignals();
    store.fetchOverview();
  }, []);

  const hasSignals = store.signals.length > 0;

  return (
    <div className="flex h-full w-full bg-[var(--app-canvas)]">
      <TodayContent />
      {(hasSignals || store.isInlineReading) && <TodayRightPanel />}
    </div>
  );
}
