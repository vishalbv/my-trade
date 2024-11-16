"use client";

import Chart from "../../src/components/Chart/Chart";
import { useEffect, useState } from "react";

interface OHLCData {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
}

export default function GlobalChart() {
  const [chartData, setChartData] = useState<OHLCData[]>([]);

  useEffect(() => {
    // Generate dummy data for the last 100 days
    const dummyData: OHLCData[] = Array.from({ length: 100 }, (_, i) => {
      const basePrice = 23000; // Base price similar to your screenshot
      const volatility = 500; // Price variation range
      const date = new Date();
      date.setDate(date.getDate() - (100 - i)); // Going backwards from today

      const open = basePrice + (Math.random() - 0.5) * volatility;
      const close = basePrice + (Math.random() - 0.5) * volatility;
      const high = Math.max(open, close) + Math.random() * volatility * 0.5;
      const low = Math.min(open, close) - Math.random() * volatility * 0.5;

      return {
        timestamp: date.getTime(),
        open,
        high,
        low,
        close,
      };
    });

    setChartData(dummyData);
  }, []);

  console.log(chartData);

  return (
    <div style={{ width: "100%", height: "600px" }}>
      <Chart data={chartData} />
    </div>
  );
}
