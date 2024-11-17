"use client";

import Chart from "../../src/components/Chart/Chart";
import { useEffect, useState } from "react";
import { getHistory } from "../../src/store/actions/appActions";
import {
  processMarketData,
  createContinuousData,
} from "../../src/components/Chart/utils/dataTransformations";
import { OHLCData } from "../../src/components/Chart/types";

interface TimeframeConfig {
  resolution: string;
  minScaleDays: number;
  maxScaleDays: number;
  tickFormat: (timestamp: number) => string;
}

const timeframeConfigs: { [key: string]: TimeframeConfig } = {
  "1": {
    // 1 minute
    resolution: "1",
    minScaleDays: 0.1, // ~2.4 hours minimum
    maxScaleDays: 5,
    tickFormat: (timestamp: number) => {
      const date = new Date(timestamp);
      return date.getHours() === 9 && date.getMinutes() === 15
        ? `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`
        : date.toLocaleTimeString();
    },
  },
  "5": {
    // 5 minutes
    resolution: "5",
    minScaleDays: 0.2,
    maxScaleDays: 10,
    tickFormat: (timestamp: number) => {
      const date = new Date(timestamp);
      return date.getHours() === 9 && date.getMinutes() === 15
        ? `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`
        : date.toLocaleTimeString();
    },
  },
  "15": {
    // 15 minutes
    resolution: "15",
    minScaleDays: 0.5,
    maxScaleDays: 30,
    tickFormat: (timestamp: number) => {
      const date = new Date(timestamp);
      return `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
    },
  },
  D: {
    // 1 day
    resolution: "D",
    minScaleDays: 5,
    maxScaleDays: 365,
    tickFormat: (timestamp: number) => new Date(timestamp).toLocaleDateString(),
  },
};

export default function GlobalChart() {
  const [chartData, setChartData] = useState<OHLCData[]>([]);
  const [timeframe, setTimeframe] = useState<string>("1");

  useEffect(() => {
    const fetchHistoricalData = async () => {
      try {
        const response = await getHistory({
          symbol: "NSE:NIFTY50-INDEX",
          resolution: timeframe,
          date_format: 0,
          range_from: Math.floor(Date.now() / 1000 - 10000 * 60).toString(),
          range_to: Math.floor(Date.now() / 1000).toString(),
          cont_flag: 1,
          broker: "fyers",
        });

        if (response?.candles && Array.isArray(response.candles)) {
          const processedData = processMarketData(response.candles);

          // Calculate time interval based on timeframe
          const timeInterval =
            timeframe === "1"
              ? 60000 // 1 minute
              : timeframe === "5"
                ? 300000 // 5 minutes
                : timeframe === "15"
                  ? 900000 // 15 minutes
                  : 86400000; // 1 day

          const continuousData = createContinuousData(
            processedData,
            timeInterval
          );
          setChartData(continuousData);
        }
      } catch (error) {
        console.error("Error fetching historical data:", error);
      }
    };

    fetchHistoricalData();
  }, [timeframe]);

  return (
    <div style={{ width: "100%", height: "600px" }}>
      <div style={{ marginBottom: "10px" }}>
        <select
          value={timeframe}
          onChange={(e) => setTimeframe(e.target.value)}
          style={{
            padding: "5px",
            marginRight: "10px",
            background: "#2a2e39",
            color: "#d1d4dc",
            border: "1px solid #363c4e",
            borderRadius: "4px",
          }}
        >
          <option value="1">1 Minute</option>
          <option value="5">5 Minutes</option>
          <option value="15">15 Minutes</option>
          <option value="D">1 Day</option>
        </select>
      </div>
      <Chart data={chartData} timeframeConfig={timeframeConfigs[timeframe]} />
    </div>
  );
}
