import { useEffect, useState, useCallback, useRef } from "react";
import { useSelector } from "react-redux";
import { getHistory } from "../../../store/actions/appActions";
import { processMarketData } from "../utils/dataTransformations";
import { OHLCData } from "../types";
import { fyersDataSocketService } from "../../../services/fyersDataSocket";
import { throttle, debounce } from "lodash";

interface UseRealtimeCandlesProps {
  symbol: string;
  timeframe: string;
  requestTicksSubscription: boolean;
}

interface HistoryResponse {
  candles?: [number, number, number, number, number, number][];
}

const getTimeIntervalForTimeframe = (timeframe: string): number => {
  switch (timeframe) {
    case "1":
      return 60000; // 1 minute in ms
    case "5":
      return 300000; // 5 minutes in ms
    case "15":
      return 900000; // 15 minutes in ms
    case "D":
      return 86400000; // 1 day in ms
    default:
      return 60000;
  }
};

// Add this helper function
const getNextCandleTime = (timeframe: string): number => {
  const now = Date.now();
  const interval = getTimeIntervalForTimeframe(timeframe);
  return Math.ceil(now / interval) * interval;
};

export const useRealtimeCandles = ({
  symbol,
  timeframe,
  requestTicksSubscription = true,
}: UseRealtimeCandlesProps) => {
  const [chartData, setChartData] = useState<OHLCData[]>([]);
  const tickData = useSelector((state: any) => state.ticks?.fyers_web);
  const isMarketActive = useSelector(
    (state: any) => state.states?.app?.marketStatus?.activeStatus
  );

  // Update currentCandleStartTime to use the correct timeframe interval
  const [currentCandleStartTime, setCurrentCandleStartTime] = useState<number>(
    () => {
      const interval = getTimeIntervalForTimeframe(timeframe);
      return Math.floor(Date.now() / interval) * interval;
    }
  );

  // Handle socket subscriptions only when market is active
  useEffect(() => {
    if (isMarketActive && requestTicksSubscription) {
      fyersDataSocketService.subscribe([symbol]);
      return () => {
        fyersDataSocketService.unsubscribe([symbol]);
      };
    }
  }, [symbol, isMarketActive]);

  // First, let's extract fetchHistoricalData to be reusable
  const fetchHistoricalData = async (
    fromTimestamp: number,
    toTimestamp: number
  ) => {
    try {
      const response = (await getHistory({
        symbol,
        resolution: timeframe,
        date_format: 0,
        range_from: fromTimestamp.toString(),
        range_to: toTimestamp.toString(),
        cont_flag: 1,
        broker: "fyers",
      })) as HistoryResponse;

      if (response?.candles && Array.isArray(response.candles)) {
        return processMarketData(response.candles);
      }
      return null;
    } catch (error) {
      console.error("Error fetching historical data:", error);
      return null;
    }
  };

  // Use a ref to store the latest price to avoid unnecessary re-renders
  const latestPriceRef = useRef<number | null>(null);

  // Optimize the update function for real-time updates
  const updateChartData = useCallback((currentPrice: number) => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
    }

    // Store the latest price
    latestPriceRef.current = currentPrice;

    rafRef.current = requestAnimationFrame(() => {
      setChartData((prevCandles) => {
        const lastCandle = prevCandles[prevCandles.length - 1];
        if (!lastCandle) return prevCandles;

        // Always update if price changed
        const updatedCandles = [...prevCandles];
        const updatedLastCandle = {
          ...lastCandle,
          close: currentPrice,
          high: Math.max(lastCandle.high, currentPrice),
          low: Math.min(lastCandle.low, currentPrice),
        };

        updatedCandles[updatedCandles.length - 1] = updatedLastCandle;
        return updatedCandles;
      });
    });
  }, []);

  // Update real-time data immediately
  useEffect(() => {
    if (
      !isMarketActive ||
      !tickData ||
      !tickData[symbol] ||
      chartData.length === 0
    )
      return;

    const currentPrice = parseFloat(tickData[symbol].ltp);

    // Only update if price actually changed
    if (currentPrice !== latestPriceRef.current) {
      updateChartData(currentPrice);
    }
  }, [tickData, symbol, chartData.length, isMarketActive, updateChartData]);

  // Replace the interval check effect with this improved version
  useEffect(() => {
    if (!isMarketActive) return;

    const scheduleNextCandle = () => {
      const now = Date.now();
      const nextCandleTime = getNextCandleTime(timeframe);
      const timeUntilNextCandle = nextCandleTime - now;

      // Schedule the next candle creation
      const timeout = setTimeout(() => {
        // Create new candle exactly at the interval
        setChartData((prevCandles) => {
          if (prevCandles.length === 0) return prevCandles;

          const lastCandle = prevCandles[prevCandles.length - 1];
          if (!lastCandle) return prevCandles;

          // Always create new candle at interval
          const latestPrice = latestPriceRef.current || lastCandle.close;
          const newCandle: OHLCData = {
            timestamp: nextCandleTime,
            open: latestPrice,
            high: latestPrice,
            low: latestPrice,
            close: latestPrice,
            volume: 0,
          };
          return [...prevCandles, newCandle];
        });

        // Update current candle start time
        setCurrentCandleStartTime(nextCandleTime);

        // Fetch after 50ms to adjust only the previous candle
        setTimeout(async () => {
          const fromTimestamp = Math.floor(
            (nextCandleTime - 2 * getTimeIntervalForTimeframe(timeframe)) / 1000
          ); // Look back 2 intervals
          const toTimestamp = Math.floor(
            (nextCandleTime - getTimeIntervalForTimeframe(timeframe)) / 1000
          ); // Up to previous candle

          const recentCandles = await fetchHistoricalData(
            fromTimestamp,
            toTimestamp
          );

          if (recentCandles && recentCandles.length > 0) {
            setChartData((prevCandles: any) => {
              // Get all candles except the current one
              const allExceptCurrent = prevCandles.slice(0, -1);
              // Get current candle
              const currentCandle = prevCandles[prevCandles.length - 1];

              // Keep all candles before the ones we're updating
              const oldCandles = allExceptCurrent.filter(
                (candle: any) => candle.timestamp < recentCandles[0]!.timestamp
              );

              return [
                ...oldCandles,
                ...recentCandles, // Update historical candles
                currentCandle, // Keep current candle unchanged
              ];
            });
          }
        }, 50);

        // Schedule the next candle
        scheduleNextCandle();
      }, timeUntilNextCandle);

      return timeout;
    };

    // Start the scheduling
    const timeoutId = scheduleNextCandle();

    // Cleanup
    return () => {
      clearTimeout(timeoutId);
    };
  }, [timeframe, symbol, isMarketActive, fetchHistoricalData]);

  // Update the real-time data effect to be more precise
  useEffect(() => {
    if (
      !isMarketActive ||
      !tickData ||
      !tickData[symbol] ||
      chartData.length === 0
    )
      return;

    const currentPrice = parseFloat(tickData[symbol].ltp);

    // Only update if price actually changed
    if (currentPrice !== latestPriceRef.current) {
      setChartData((prevCandles) => {
        const lastCandle = prevCandles[prevCandles.length - 1];
        if (!lastCandle) return prevCandles;

        // Only update if this tick belongs to the current candle
        if (lastCandle.timestamp !== currentCandleStartTime) {
          return prevCandles;
        }

        const updatedCandles = [...prevCandles];
        const updatedLastCandle = {
          ...lastCandle,
          close: currentPrice,
          high: Math.max(lastCandle.high, currentPrice),
          low: Math.min(lastCandle.low, currentPrice),
        };

        updatedCandles[updatedCandles.length - 1] = updatedLastCandle;
        latestPriceRef.current = currentPrice;
        return updatedCandles;
      });
    }
  }, [
    tickData,
    symbol,
    chartData.length,
    isMarketActive,
    currentCandleStartTime,
  ]);

  // Add RAF reference to prevent multiple updates in same frame
  const rafRef = useRef<number>();

  // Cleanup RAF on unmount
  useEffect(() => {
    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);

  // Reset currentCandleStartTime when timeframe changes
  useEffect(() => {
    const interval = getTimeIntervalForTimeframe(timeframe);
    setCurrentCandleStartTime(Math.floor(Date.now() / interval) * interval);

    setChartData([]);
  }, [timeframe, symbol]);

  // Add this new effect for initial data fetch
  useEffect(() => {
    const fetchInitialData = async () => {
      const now = Date.now();
      const fromTimestamp = Math.floor(now / 1000 - 40000 * 60); // Last 5 minutes
      const toTimestamp = Math.floor(now / 1000);

      const initialCandles = await fetchHistoricalData(
        fromTimestamp,
        toTimestamp
      );
      if (initialCandles) {
        setChartData(initialCandles);
      }
    };

    fetchInitialData();
  }, [symbol, timeframe]); // Re-fetch when symbol or timeframe changes

  return { chartData, setChartData };
};
