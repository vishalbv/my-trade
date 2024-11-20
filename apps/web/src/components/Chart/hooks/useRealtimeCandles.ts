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

  // Update currentCandleStartTime to use the correct timeframe interval
  const [currentCandleStartTime, setCurrentCandleStartTime] = useState<number>(
    () => {
      const interval = getTimeIntervalForTimeframe(timeframe);
      return Math.floor(Date.now() / interval) * interval;
    }
  );

  // Handle socket subscriptions
  useEffect(() => {
    fyersDataSocketService.subscribe([symbol]);
    return () => {
      fyersDataSocketService.unsubscribe([symbol]);
    };
  }, [symbol]);

  // Fetch historical data
  useEffect(() => {
    const fetchHistoricalData = async () => {
      try {
        const response = (await getHistory({
          symbol,
          resolution: timeframe,
          date_format: 0,
          range_from: Math.floor(Date.now() / 1000 - 20000 * 60).toString(),
          range_to: Math.floor(Date.now() / 1000).toString(),
          cont_flag: 1,
          broker: "fyers",
        })) as HistoryResponse;

        if (response?.candles && Array.isArray(response.candles)) {
          const processedData = processMarketData(response.candles);
          setChartData(processedData);
        }
      } catch (error) {
        console.error("Error fetching historical data:", error);
      }
    };

    fetchHistoricalData();
  }, [timeframe, symbol]);

  // Update real-time data
  useEffect(() => {
    if (!tickData || !tickData[symbol] || chartData.length === 0) return;

    const currentPrice = parseFloat(tickData[symbol].price);

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
  }, [tickData, symbol, chartData.length]);

  // Create new candles based on timeframe
  useEffect(() => {
    const timeInterval = getTimeIntervalForTimeframe(timeframe);

    const interval = setInterval(() => {
      const now = Date.now();
      const currentIntervalStart =
        Math.floor(now / timeInterval) * timeInterval;

      if (currentIntervalStart > currentCandleStartTime) {
        setCurrentCandleStartTime(currentIntervalStart);

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
            index: lastCandle.index + 1,
          };
          return [...prevCandles, newCandle];
        });
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [currentCandleStartTime, timeframe]);

  // Reset currentCandleStartTime when timeframe changes
  useEffect(() => {
    const interval = getTimeIntervalForTimeframe(timeframe);
    setCurrentCandleStartTime(Math.floor(Date.now() / interval) * interval);
  }, [timeframe]);

  return { chartData, setChartData };
};
