"use client";

import { MarketInfo } from "../../src/components/HomeComponents/MarketInfo";
import { TopMovers } from "../../src/components/HomeComponents/TopMovers";
import { AccountLockStatus } from "../../src/components/HomeComponents/AccountLockStatus";
import { HolidayStatus } from "../../src/components/HomeComponents/HolidayStatus";
import { PLSummary } from "../../src/components/HomeComponents/PLSummary";
import { TradingStats } from "../../src/components/HomeComponents/TradingStats";
import { RiskMetrics } from "../../src/components/HomeComponents/RiskMetrics";
import { PositionHeatMap } from "../../src/components/HomeComponents/PositionHeatMap";
import { OpenOrders } from "../../src/components/HomeComponents/OpenOrders";
import { TradingJournal } from "../../src/components/HomeComponents/TradingJournal";
import { MarketInformation } from "../../src/components/HomeComponents/MarketInformation";

import { getOptionChain } from "../../src/store/actions/appActions";
import { useEffect } from "react";

export default function Home() {
  return (
    <div className="container mx-auto p-4 space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold mb-2">Trading Dashboard</h1>
        <HolidayStatus />
      </div>

      <AccountLockStatus />
      <MarketInformation />
      {/* Trading Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <PLSummary />
        <TradingStats />
        <RiskMetrics />
      </div>

      {/* Position and Orders */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <TradingJournal />
        {/* <MarketInfo /> */}
        <TopMovers />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <PositionHeatMap />
        <OpenOrders />
      </div>

      {/* Trading Journal and Market Info */}
    </div>
  );
}
