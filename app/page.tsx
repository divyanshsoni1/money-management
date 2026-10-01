"use client";

import Header from "./components/Header";
import ConfigurationCard from "./components/ConfigurationCard";
import RecommendationCard from "./components/RecommendationCard";
import TradesStakesCard from "./components/TradesStakesCard";
import Footer from "./components/Footer";
import { useMoneyManagement } from "./hooks/useMoneyManagement";

export default function HomePage() {
  const mm = useMoneyManagement();

  return (
    <div className="page-root">
      {/* Ambient glow wrapper */}
      <div className="page-glow" aria-hidden="true" />

      <div className="page-content">
        {/* 1. Header / Hero */}
        <Header />

        {/* Dashboard column */}
        <main className="dashboard-col">
          {/* 2. Main configuration card */}
          <ConfigurationCard
            balanceRaw={mm.balanceRaw}
            tradesRaw={mm.tradesRaw}
            expectedWinsRaw={mm.expectedWinsRaw}
            averagePayout={mm.averagePayout}
            profitPercentage={mm.profitPercentage}
            onBalanceChange={mm.setBalanceRaw}
            onTradesChange={mm.setTradesRaw}
            onExpectedWinsChange={mm.setExpectedWinsRaw}
          />

          {/* 3. Recommendation card */}
          <RecommendationCard />

          {/* 4. Trades & Stakes card */}
          <TradesStakesCard
            tradeEntries={mm.tradeEntries}
            onResetAll={mm.resetAllTrades}
            onMarkTrade={mm.markTrade}
          />
        </main>

        {/* 5. Footer */}
        <Footer />
      </div>
    </div>
  );
}
