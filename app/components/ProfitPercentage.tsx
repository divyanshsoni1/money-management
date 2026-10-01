// Refresh icon as inline SVG
function RefreshIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="w-5 h-5"
    >
      <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
      <path d="M3 3v5h5" />
    </svg>
  );
}

interface ProfitPercentageProps {
  /** Calculated profit percentage value; null means inputs are incomplete/invalid */
  value: number | null;
  /** Called when the user clicks the refresh/reset icon button */
  onReset?: () => void;
}

export default function ProfitPercentage({
  value,
  onReset,
}: ProfitPercentageProps) {
  // Format for display: show "—" when no valid value available
  const display =
    value === null ? "—" : `${value >= 0 ? "" : ""}${value.toFixed(2)}%`;

  return (
    <div className="flex items-center gap-3 mt-4">
      {/* Main percentage block */}
      <div className="flex-1 rounded-xl bg-amber-950/30 border border-amber-700/40 shadow-[0_0_18px_rgba(180,83,9,0.25)] px-4 py-4 text-center min-w-0">
        <p className="text-[10px] sm:text-xs font-semibold tracking-[0.2em] uppercase text-amber-600/80 mb-1">
          Profit Percentage
        </p>
        <p className="text-3xl sm:text-4xl font-bold text-amber-400 drop-shadow-[0_0_10px_rgba(251,191,36,0.5)] truncate">
          {display}
        </p>
      </div>

      {/* Reset / Refresh button */}
      <button
        type="button"
        aria-label="Reset profit percentage"
        onClick={onReset}
        className="shrink-0 flex items-center justify-center w-12 h-12 rounded-xl bg-[#1c1c1e] border border-white/10 text-amber-400 hover:border-amber-500/40 transition-colors"
      >
        <RefreshIcon />
      </button>
    </div>
  );
}
