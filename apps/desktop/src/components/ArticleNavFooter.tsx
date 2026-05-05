import { ChevronLeft, ChevronRight } from "lucide-react";

interface ArticleNavFooterProps {
  canPrev: boolean;
  canNext: boolean;
  onPrev?: () => void;
  onNext?: () => void;
  prevLabel?: string;
  nextLabel?: string;
  label?: string;
}

export function ArticleNavFooter({
  canPrev,
  canNext,
  onPrev,
  onNext,
  prevLabel = "Prev",
  nextLabel = "Next",
  label,
}: ArticleNavFooterProps) {
  return (
    <div className="flex min-w-0 items-center gap-2 px-5 py-3 border-t border-[var(--gray-4)] shrink-0">
      <button
        onClick={() => canPrev && onPrev?.()}
        disabled={!canPrev}
        className="flex items-center gap-1 text-[11px] text-[var(--gray-9)] hover:text-[var(--gray-12)] transition-colors px-2 py-1 rounded hover:bg-[var(--gray-3)] disabled:opacity-40 disabled:cursor-default disabled:hover:bg-transparent"
      >
        <ChevronLeft size={14} />
        <span>{prevLabel}</span>
      </button>

      <div className="flex-1" />

      {label && (
        <span className="min-w-0 break-words text-center text-[10px] text-[var(--gray-8)]">
          {label}
        </span>
      )}

      <div className="flex-1" />

      <button
        onClick={() => canNext && onNext?.()}
        disabled={!canNext}
        className="flex items-center gap-1 text-[11px] text-[var(--gray-9)] hover:text-[var(--gray-12)] transition-colors px-2 py-1 rounded hover:bg-[var(--gray-3)] disabled:opacity-40 disabled:cursor-default disabled:hover:bg-transparent"
      >
        <span>{nextLabel}</span>
        <ChevronRight size={14} />
      </button>
    </div>
  );
}
