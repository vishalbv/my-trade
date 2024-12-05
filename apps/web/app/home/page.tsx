"use client";

import { MarketHolidays } from "../../src/components/HomeComponents/MarketHolidays";
import { MarketInfo } from "../../src/components/HomeComponents/MarketInfo";
import { TopMovers } from "../../src/components/HomeComponents/TopMovers";

export default function Home() {
  return (
    <div className="container mx-auto p-4 space-y-4">
      <h1 className="text-2xl font-bold mb-6">My Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <MarketInfo />
        <MarketHolidays />
        <TopMovers />
      </div>
    </div>
  );
}
