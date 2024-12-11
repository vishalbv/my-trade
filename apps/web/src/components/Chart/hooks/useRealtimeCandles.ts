import { useEffect, useState, useCallback, useRef } from "react";
import { useSelector } from "react-redux";
import { getHistory } from "../../../store/actions/appActions";
import { processMarketData } from "../utils/dataTransformations";
import { OHLCData } from "../types";
import { fyersDataSocketService } from "../../../services/fyersDataSocket";
import { throttle, debounce } from "lodash";
import { isHoliday } from "@repo/utils/helpers";

interface UseRealtimeCandlesProps {
  symbol: string;
  timeframe: string;
  requestTicksSubscription: boolean;
}

interface HistoryResponse {
  candles?: [number, number, number, number, number, number][];
}

const MARKET_START_HOUR = 9; // 9:15 AM
const MARKET_START_MINUTE = 15;
const MARKET_END_HOUR = 15; // 3:30 PM
const MARKET_END_MINUTE = 30;

const CANDLES_PER_DAY = {
  "1": 375, // (6 hours 15 mins = 375 minutes)
  "5": 75, // (375 / 5 = 75 5-minute candles)
  "15": 25, // (375 / 15 = 25 15-minute candles)
  D: 1, // 1 candle per day
};

const isWithinMarketHours = (date: Date): boolean => {
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const timeValue = hours * 60 + minutes;
  const marketStartTime = MARKET_START_HOUR * 60 + MARKET_START_MINUTE;
  const marketEndTime = MARKET_END_HOUR * 60 + MARKET_END_MINUTE;

  return timeValue >= marketStartTime && timeValue <= marketEndTime;
};

const getTimeIntervalForTimeframe = (
  timeframe: string,
  currentTime: Date = new Date()
): number => {
  const baseInterval = (() => {
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
  })();

  // For intraday timeframes, adjust to market hours
  if (timeframe !== "D") {
    const marketOpenTime = new Date(currentTime);
    marketOpenTime.setHours(MARKET_START_HOUR, MARKET_START_MINUTE, 0, 0);

    const marketCloseTime = new Date(currentTime);
    marketCloseTime.setHours(MARKET_END_HOUR, MARKET_END_MINUTE, 0, 0);

    // If current time is before market open, return time until market open
    if (currentTime < marketOpenTime) {
      return marketOpenTime.getTime() - currentTime.getTime();
    }

    // If current time is after market close, return time until next market open
    if (currentTime > marketCloseTime) {
      marketOpenTime.setDate(marketOpenTime.getDate() + 1);
      return marketOpenTime.getTime() - currentTime.getTime();
    }
  }

  return baseInterval;
};

const calculateFromTimestamp = (
  timeframe: string,
  holidays: string[]
): number => {
  const now = new Date();

  // Set fixed day ranges based on timeframe
  let daysToGoBack = 0;

  switch (timeframe) {
    case "D":
      daysToGoBack = 365; // For daily, go back 365 days
      break;
    case "15":
      daysToGoBack = 99; // For 15min, go back 99 days
      break;
    case "5":
      daysToGoBack = 30; // For 5min, also 99 days
      break;
    case "1":
      daysToGoBack = 6; // For 1min, also 99 days
      break;
    default:
      daysToGoBack = 99;
  }

  let currentDate = new Date(now);
  currentDate.setDate(currentDate.getDate() - daysToGoBack);

  // For intraday timeframes, set to market opening time
  if (timeframe !== "D") {
    currentDate.setHours(MARKET_START_HOUR, MARKET_START_MINUTE, 0, 0);
  }

  return Math.floor(currentDate.getTime() / 1000);
};

const getNextCandleTime = (timeframe: string): number => {
  const now = new Date();
  const interval = getTimeIntervalForTimeframe(timeframe, now);

  if (!isWithinMarketHours(now)) {
    // If outside market hours, return next market open time
    const nextOpen = new Date(now);
    nextOpen.setHours(MARKET_START_HOUR, MARKET_START_MINUTE, 0, 0);
    if (now.getHours() >= MARKET_END_HOUR) {
      nextOpen.setDate(nextOpen.getDate() + 1);
    }
    return nextOpen.getTime();
  }

  return Math.ceil(now.getTime() / interval) * interval;
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

  const holidays = useSelector(
    (state: any) => state.states.app?.holidays || []
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
  const fetchHistoricalData = useCallback(
    async (fromTimestamp: number, toTimestamp: number) => {
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
    },
    [symbol, timeframe]
  );

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

  // Add these refs at the top of the hook
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const fetchTimeoutRef = useRef<ReturnType<typeof setTimeout>>();

  // Add a ref to track if we're currently updating
  const isUpdatingRef = useRef(false);

  // Modify the scheduleNextCandle function
  const scheduleNextCandle = useCallback(() => {
    if (isUpdatingRef.current) return; // Prevent concurrent updates

    // Clear any existing timeouts
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    if (fetchTimeoutRef.current) {
      clearTimeout(fetchTimeoutRef.current);
    }

    const now = Date.now();
    const nextCandleTime = getNextCandleTime(timeframe);
    const timeUntilNextCandle = nextCandleTime - now;

    timeoutRef.current = setTimeout(() => {
      isUpdatingRef.current = true;

      setChartData((prevCandles) => {
        if (prevCandles.length === 0) return prevCandles;

        const lastCandle = prevCandles[prevCandles.length - 1];
        if (!lastCandle) return prevCandles;

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

      setCurrentCandleStartTime(nextCandleTime);

      fetchTimeoutRef.current = setTimeout(async () => {
        try {
          const fromTimestamp = Math.floor(
            (nextCandleTime - 2 * getTimeIntervalForTimeframe(timeframe)) / 1000
          );
          const toTimestamp = Math.floor(
            (nextCandleTime - getTimeIntervalForTimeframe(timeframe)) / 1000
          );

          const recentCandles = await fetchHistoricalData(
            fromTimestamp,
            toTimestamp
          );

          if (recentCandles && recentCandles.length > 0) {
            setChartData((prevCandles) => {
              const allExceptCurrent = prevCandles.slice(0, -1);
              const currentCandle = prevCandles[prevCandles.length - 1];
              if (!currentCandle) return prevCandles;

              const oldCandles = allExceptCurrent.filter(
                (candle) => candle.timestamp < recentCandles[0]!.timestamp
              );

              return [
                ...oldCandles,
                ...recentCandles,
                currentCandle,
              ] as OHLCData[];
            });
          }
        } catch (error) {
          console.error("Error updating candles:", error);
        } finally {
          isUpdatingRef.current = false;
          scheduleNextCandle();
        }
      }, 50);
    }, timeUntilNextCandle);
  }, [timeframe, fetchHistoricalData]);

  // Replace the interval check effect with this improved version
  useEffect(() => {
    if (!isMarketActive) return;

    // Start the scheduling
    scheduleNextCandle();

    // Cleanup function
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (fetchTimeoutRef.current) {
        clearTimeout(fetchTimeoutRef.current);
      }
    };
  }, [timeframe, symbol, isMarketActive]);

  // Modify the real-time update effect
  useEffect(() => {
    if (
      !isMarketActive ||
      !tickData ||
      !tickData[symbol] ||
      chartData.length === 0 ||
      isUpdatingRef.current
    )
      return;

    const currentPrice = parseFloat(tickData[symbol].ltp);
    if (currentPrice !== latestPriceRef.current) {
      isUpdatingRef.current = true;
      try {
        setChartData((prevCandles) => {
          const lastCandle = prevCandles[prevCandles.length - 1];
          if (!lastCandle) return prevCandles;

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
      } finally {
        isUpdatingRef.current = false;
      }
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

  // Update the initial data fetch effect
  useEffect(() => {
    const fetchInitialData = async () => {
      const fromTimestamp = calculateFromTimestamp(timeframe, holidays);
      const toTimestamp = Math.floor(Date.now() / 1000);

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
