import { useState, useEffect, useCallback } from "react";
import { deltaWebSocket } from "../../../services/deltaWebSocket";
import { deltaExchangeApi, OHLCData } from "../../../services/deltaExchange";

interface UseDeltaRealtimeCandlesConfig {
  symbol: string;
  resolution: string;
}

interface WebSocketCandle {
  candle_start_time: number;
  close: number;
  high: number;
  low: number;
  open: number;
  volume: number;
  timestamp: number;
  symbol: string;
  type: string;
  resolution: string;
}

const normalizeTimestamp = (timestamp: number): number => {
  // If timestamp is in microseconds (> 1e15), convert to milliseconds
  if (timestamp > 1e15) {
    return Math.floor(timestamp / 1000); // Convert microseconds to milliseconds
  }
  // If timestamp is in seconds (< 1e10), convert to milliseconds
  if (timestamp < 1e10) {
    return timestamp * 1000;
  }
  // If timestamp is already in milliseconds, return as is
  return timestamp;
};

export const useDeltaRealtimeCandles = ({
  symbol,
  resolution,
}: UseDeltaRealtimeCandlesConfig) => {
  const [chartData, setChartData] = useState<OHLCData[]>([]);

  // Fetch initial historical data
  const fetchHistoricalData = useCallback(async () => {
    try {
      const end = Math.floor(Date.now() / 1000);
      const start = end - 100 * 24 * 60 * 60; // Last 7 days

      const data = await deltaExchangeApi.getOHLCData({
        symbol,
        resolution,
        start,
        end,
      });

      setChartData(data);
    } catch (error) {
      console.error("Error fetching historical data:", error);
    }
  }, [symbol, resolution]);

  // Handle real-time updates
  const handleRealtimeUpdate = useCallback(
    (wsData: any) => {
      if (wsData.type === `candlestick_${resolution}`) {
        const data = wsData as WebSocketCandle;

        setChartData((prevData) => {
          const newData = [...prevData];
          const normalizedTimestamp = normalizeTimestamp(
            data.candle_start_time
          );
          const lastCandle = newData[newData.length - 1];

          // Create normalized candle data
          const normalizedCandle: OHLCData = {
            timestamp: normalizedTimestamp,
            open: data.open,
            high: data.high,
            low: data.low,
            close: data.close,
            volume: data.volume,
          };

          // If it's an update to the current candle
          if (lastCandle && lastCandle.timestamp === normalizedTimestamp) {
            newData[newData.length - 1] = normalizedCandle;
          } else {
            // It's a new candle
            newData.push(normalizedCandle);

            // Keep only last 7 days of data
            const sevenDaysAgo =
              Math.floor(Date.now() / 1000) - 7 * 24 * 60 * 60;
            while (newData.length > 0 && newData[0]?.timestamp < sevenDaysAgo) {
              newData.shift();
            }
          }

          return newData;
        });
      }
    },
    [resolution]
  );

  // Set up WebSocket subscription
  useEffect(() => {
    // Fetch initial data
    fetchHistoricalData();

    // Subscribe to real-time updates
    const channel = `candlestick_${resolution}`;
    deltaWebSocket.subscribe(channel, [symbol]);
    deltaWebSocket.addChannelHandler(channel, symbol, handleRealtimeUpdate);

    return () => {
      deltaWebSocket.removeChannelHandler(
        channel,
        symbol,
        handleRealtimeUpdate
      );
    };
  }, [symbol, resolution, fetchHistoricalData, handleRealtimeUpdate]);

  return {
    chartData,
    setChartData,
  };
};
