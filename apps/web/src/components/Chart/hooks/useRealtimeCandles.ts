import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { getHistory } from "../../../store/actions/appActions";
import { processMarketData } from "../utils/dataTransformations";
import { OHLCData } from "../types";
import { fyersDataSocketService } from "../../../services/fyersDataSocket";

interface UseRealtimeCandlesProps {
  symbol: string;
  timeframe: string;
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

export const useRealtimeCandles = ({
  symbol,
  timeframe,
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
    if (isMarketActive) {
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

  useEffect(() => {
    if (!isMarketActive) return;

    const timeInterval = getTimeIntervalForTimeframe(timeframe);
    const interval = setInterval(() => {
      const now = Date.now();
      const currentIntervalStart =
        Math.floor(now / timeInterval) * timeInterval;

      if (currentIntervalStart > currentCandleStartTime) {
        setCurrentCandleStartTime(currentIntervalStart);

        // Create new candle immediately
        setChartData((prevCandles) => {
          if (prevCandles.length === 0) return prevCandles;
          const lastCandle = prevCandles[prevCandles.length - 1];
          if (!lastCandle) return prevCandles;

          const newCandle: OHLCData = {
            timestamp: currentIntervalStart,
            open: lastCandle.close,
            high: lastCandle.close,
            low: lastCandle.close,
            close: lastCandle.close,
            volume: 0,
          };
          return [...prevCandles, newCandle];
        });

        // Verify and fix data after 2 seconds
        setTimeout(async () => {
          const fromTimestamp = Math.floor((now - 4 * 60 * 1000) / 1000);
          const toTimestamp = Math.floor(now / 1000);

          const recentCandles = await fetchHistoricalData(
            fromTimestamp,
            toTimestamp
          );

          if (recentCandles && recentCandles.length > 0) {
            setChartData((prevCandles) => {
              const oldCandles = prevCandles.filter(
                (candle) => candle.timestamp < recentCandles[0]!.timestamp
              );
              return [...oldCandles, ...recentCandles];
            });
          }
        }, 2000);
      }
    }, 100);

    return () => clearInterval(interval);
  }, [currentCandleStartTime, timeframe, symbol, isMarketActive]);

  // Update real-time data
  useEffect(() => {
    if (
      !isMarketActive ||
      !tickData ||
      !tickData[symbol] ||
      chartData.length === 0
    )
      return;

    const currentPrice = parseFloat(tickData[symbol].ltp);

    setChartData((prevCandles) => {
      const updatedCandles = [...prevCandles];
      const lastCandle = updatedCandles[updatedCandles.length - 1];

      if (lastCandle) {
        const updatedLastCandle = {
          ...lastCandle,
          close: currentPrice,
          high: Math.max(lastCandle.high, currentPrice),
          low: Math.min(lastCandle.low, currentPrice),
        };

        updatedCandles[updatedCandles.length - 1] = updatedLastCandle;
      }

      return updatedCandles;
    });
  }, [tickData, symbol, chartData.length, isMarketActive]);
  console.log(chartData, "pppp");
  // Reset currentCandleStartTime when timeframe changes
  useEffect(() => {
    const interval = getTimeIntervalForTimeframe(timeframe);
    setCurrentCandleStartTime(Math.floor(Date.now() / interval) * interval);
    console.log("ooopppppppppp");
    setChartData([]);
  }, [timeframe, symbol]);
  console.log(timeframe, "ooopppppppppp");

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
