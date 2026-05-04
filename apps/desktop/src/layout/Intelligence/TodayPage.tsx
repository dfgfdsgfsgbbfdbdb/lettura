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
      setPipelineStatus: state.setPipelineStatus,
      setPipelineProgress: state.setPipelineProgress,
      setPipelineError: state.setPipelineError,
      signals: state.signals,
      isInlineReading: state.isInlineReading,
    })),
  );

  useEffect(() => {
    store.fetchAIConfig();
    store.fetchSignals();
    store.fetchOverview();
  }, []);

  useEffect(() => {
    if (!(window as any).__TAURI_INTERNALS__) return;

    const unsubs: (() => void)[] = [];
    let cancelled = false;

    import("@tauri-apps/api/event").then(async ({ listen }) => {
      if (cancelled) return;

      unsubs.push(
        await listen("pipeline:started", () => {
          store.setPipelineStatus("running");
        }),
      );
      unsubs.push(
        await listen("pipeline:progress", (e: any) => {
          const { stage, current, total } = e.payload;
          store.setPipelineProgress(stage, current, total);
        }),
      );
      unsubs.push(
        await listen("pipeline:completed", () => {
          store.setPipelineStatus("done");
        }),
      );
      unsubs.push(
        await listen("pipeline:failed", (e: any) => {
          const msg = e.payload?.error_message || "Unknown error";
          store.setPipelineError(msg);
        }),
      );

      const { invoke } = await import("@tauri-apps/api/core");
      const running = await invoke<boolean>("is_pipeline_running");
      if (!cancelled && running) {
        store.setPipelineStatus("running");
      }
    });

    return () => {
      cancelled = true;
      unsubs.forEach((unsub) => unsub());
    };
  }, []);

  const hasSignals = store.signals.length > 0;

  return (
    <div className="flex h-full w-full bg-[var(--app-canvas)]">
      <TodayContent />
      {(hasSignals || store.isInlineReading) && <TodayRightPanel />}
    </div>
  );
}
