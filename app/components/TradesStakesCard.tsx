import TradeRow from "./TradeRow";
import type { TradeEntry } from "../hooks/useMoneyManagement";

interface TradesStakesCardProps {
  tradeEntries: TradeEntry[];
  onResetAll: () => void;
  onMarkTrade: (index: number, result: "win" | "loss") => void;
}

export default function TradesStakesCard({
  tradeEntries,
  onResetAll,
  onMarkTrade,
}: TradesStakesCardProps) {
  const isEmpty = tradeEntries.length === 0;

  return (
    <section
      aria-label="Trades and Stakes"
      className="rounded-2xl bg-[#161618] border border-white/8 shadow-[0_4px_32px_rgba(0,0,0,0.6)] p-4 sm:p-6"
    >
      {/* Section heading with decorative line */}
      <div className="flex items-center gap-3 mb-4">
        <h2 className="text-xs sm:text-sm font-semibold tracking-[0.2em] uppercase text-gray-500 whitespace-nowrap">
          Trades &amp; Stakes
        </h2>
        <div className="flex-1 h-px bg-white/8" />
      </div>

      {/* Column headers — only shown when there are rows */}
      {!isEmpty && (
        <div className="flex items-center gap-2 sm:gap-3 pb-2">
          <span className="w-6 shrink-0 text-center text-[10px] sm:text-xs font-semibold tracking-widest uppercase text-gray-600">
            #
          </span>
          <span className="min-w-[64px] shrink-0 text-[10px] sm:text-xs font-semibold tracking-widest uppercase text-gray-600">
            Stake
          </span>
          <span className="flex-1 text-[10px] sm:text-xs font-semibold tracking-widest uppercase text-gray-600">
            Win / Loss
          </span>
          <span className="w-20 sm:w-28 shrink-0 text-[10px] sm:text-xs font-semibold tracking-widest uppercase text-gray-600 text-right">
            New Balance
          </span>
        </div>
      )}

      {/* Empty state */}
      {isEmpty && (
        <p className="text-sm text-gray-600 text-center py-4">
          Set Balance and Trades above to generate your trade plan.
        </p>
      )}

      {/* Trade rows */}
      {tradeEntries.map((entry) => (
        <TradeRow key={entry.index} entry={entry} onMark={onMarkTrade} />
      ))}

      {/* Reset All button */}
      <div className="mt-5">
        <button
          type="button"
          aria-label="Reset all trades"
          onClick={onResetAll}
          className="w-full flex items-center justify-center gap-2 rounded-xl bg-amber-400 text-black font-bold text-base sm:text-lg py-4 tracking-wide shadow-[0_4px_20px_rgba(251,191,36,0.3)] hover:bg-amber-300 transition-colors"
        >
          {/* Refresh icon */}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            className="w-5 h-5 shrink-0"
          >
            <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
            <path d="M3 3v5h5" />
          </svg>
          Reset All
        </button>
      </div>
    </section>
  );
}
