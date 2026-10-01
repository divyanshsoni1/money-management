import MetricField from "./MetricField";
import ProfitPercentage from "./ProfitPercentage";

interface ConfigurationCardProps {
  balanceRaw: string;
  tradesRaw: string;
  expectedWinsRaw: string;
  averagePayout: number;
  profitPercentage: number | null;
  onBalanceChange: (v: string) => void;
  onTradesChange: (v: string) => void;
  onExpectedWinsChange: (v: string) => void;
}

export default function ConfigurationCard({
  balanceRaw,
  tradesRaw,
  expectedWinsRaw,
  averagePayout,
  profitPercentage,
  onBalanceChange,
  onTradesChange,
  onExpectedWinsChange,
}: ConfigurationCardProps) {
  return (
    <section
      aria-label="Configuration"
      className="rounded-2xl bg-[#161618] border border-white/8 shadow-[0_4px_32px_rgba(0,0,0,0.6)] p-4 sm:p-6"
    >
      {/*
        Layout:
          sm+ (≥640px): unchanged 2-column grid, all 4 fields + ProfitPercentage below
          xs (<640px):
            Row 1: Balance | Trades
            Row 2: Expected Wins | Average Payout
            Row 3: Profit Percentage centered (full-width, handled by ProfitPercentage wrapper)
      */}

      {/* ── sm+ layout: 2-col grid (unchanged desktop behaviour) ── */}
      <div className="hidden sm:grid sm:grid-cols-2 gap-4">
        <MetricField
          label="Balance"
          value={balanceRaw}
          prefix="₹"
          helper="(At risk)"
          onChange={onBalanceChange}
          inputMode="decimal"
          placeholder="0"
        />
        <MetricField
          label="Trades"
          value={tradesRaw}
          helper="1–100"
          onChange={onTradesChange}
          inputMode="numeric"
          placeholder="0"
        />
        <MetricField
          label="Expected Wins"
          value={expectedWinsRaw}
          helper="≤ Trades"
          onChange={onExpectedWinsChange}
          inputMode="numeric"
          placeholder="0"
        />
        <MetricField
          label="Average Payout"
          value={String(averagePayout)}
          suffix="%"
          highlighted
        />
      </div>

      {/* ── xs layout: custom mobile rows ── */}
      <div className="sm:hidden flex flex-col gap-4">
        {/* Row 1: Balance + Trades */}
        <div className="grid grid-cols-2 gap-3">
          <MetricField
            label="Balance"
            value={balanceRaw}
            prefix="₹"
            helper="(At risk)"
            onChange={onBalanceChange}
            inputMode="decimal"
            placeholder="0"
          />
          <MetricField
            label="Trades"
            value={tradesRaw}
            helper="1–100"
            onChange={onTradesChange}
            inputMode="numeric"
            placeholder="0"
          />
        </div>

        {/* Row 2: Expected Wins + Average Payout */}
        <div className="grid grid-cols-2 gap-3">
          <MetricField
            label="Expected Wins"
            value={expectedWinsRaw}
            helper="≤ Trades"
            onChange={onExpectedWinsChange}
            inputMode="numeric"
            placeholder="0"
          />
          <MetricField
            label="Average Payout"
            value={String(averagePayout)}
            suffix="%"
            highlighted
          />
        </div>
      </div>

      {/* Row 3 (mobile) / bottom (desktop): Profit Percentage — always full width */}
      <ProfitPercentage value={profitPercentage} />
    </section>
  );
}
