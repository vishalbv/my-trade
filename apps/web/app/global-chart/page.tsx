"use client";

import Chart from "../../src/components/Chart/Chart";
import { useEffect, useState } from "react";
import { getHistory } from "../../src/store/actions/appActions";
import moment from "moment";

interface OHLCData {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  index?: number; // Add index for continuous scaling
}

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
          resolution: "1",
          date_format: 0,
          range_from: Math.floor(Date.now() / 1000 - 10000 * 60).toString(),
          range_to: Math.floor(Date.now() / 1000).toString(),
          cont_flag: 1,
          broker: "fyers",
        });

        if (response?.candles && Array.isArray(response?.candles)) {
          // Transform data first
          const transformedData: OHLCData[] = response.candles.map(
            (candle: any[], index: number) => ({
              timestamp: candle[0] * 1000,
              open: candle[1],
              high: candle[2],
              low: candle[3],
              close: candle[4],
              index,
            })
          );

          // Sort by timestamp first
          const sortedData = transformedData.sort(
            (a, b) => a.timestamp - b.timestamp
          );

          // Filter market hours data but preserve continuous indexing
          let continuousIndex = 0;
          const filteredData = sortedData.filter((candle) => {
            const date = new Date(candle.timestamp);
            const hours = date.getHours();
            const minutes = date.getMinutes();
            const time = hours * 60 + minutes;
            const isMarketHours = time >= 9 * 15 && time <= 15 * 60 + 30;

            if (isMarketHours) {
              // Update the index to be continuous
              candle.index = continuousIndex++;
              return true;
            }
            return false;
          });

          // Adjust timestamps to be continuous (remove gaps)
          const timeInterval =
            timeframe === "1"
              ? 60000 // 1 minute
              : timeframe === "5"
                ? 300000 // 5 minutes
                : timeframe === "15"
                  ? 900000 // 15 minutes
                  : 86400000; // 1 day

          const continuousData = filteredData.map((candle, idx) => ({
            ...candle,
            timestamp: filteredData[0].timestamp + idx * timeInterval, // Create continuous timestamps
            index: idx,
          }));

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
