import type { TradeEntry } from "../hooks/useMoneyManagement";

interface TradeRowProps {
  entry: TradeEntry;
  onMark: (index: number, result: "win" | "loss") => void;
}

export default function TradeRow({ entry, onMark }: TradeRowProps) {
  const { index, stake, result, newBalance } = entry;

  return (
    <div className="flex items-center gap-2 sm:gap-3 py-3 border-t border-white/6">
      {/* # */}
      <span className="w-6 shrink-0 text-center text-sm font-semibold text-gray-400">
        {index}
      </span>

      {/* Stake */}
      <div className="flex items-center gap-1 min-w-[64px] shrink-0">
        <span className="text-sm sm:text-base font-bold text-white">
          ₹{stake}
        </span>
      </div>

      {/* WIN / LOSS buttons */}
      <div className="flex items-center gap-2 flex-1">
        <button
          type="button"
          aria-label="Mark as win"
          onClick={() => onMark(index, "win")}
          className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold border transition-colors whitespace-nowrap ${
            result === "win"
              ? "bg-green-500/20 border-green-500/60 text-green-400"
              : "text-gray-300 bg-[#252527] border-white/10 hover:border-green-500/40 hover:text-green-400"
          }`}
        >
          WIN
        </button>
        <button
          type="button"
          aria-label="Mark as loss"
          onClick={() => onMark(index, "loss")}
          className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold border transition-colors whitespace-nowrap ${
            result === "loss"
              ? "bg-red-500/20 border-red-500/60 text-red-400"
              : "text-gray-300 bg-[#252527] border-white/10 hover:border-red-500/40 hover:text-red-400"
          }`}
        >
          LOSS
        </button>
      </div>

      {/* New Balance */}
      <div className="w-20 sm:w-28 shrink-0 rounded-lg bg-[#1c1c1e] border border-white/8 h-9 flex items-center justify-end px-2">
        {newBalance !== null && (
          <span
            className={`text-xs sm:text-sm font-semibold truncate ${
              result === "win" ? "text-green-400" : "text-red-400"
            }`}
          >
            ₹{newBalance}
          </span>
        )}
      </div>
    </div>
  );
}
