import { OHLCData } from "../types";

interface RawCandle {
  0: number; // timestamp
  1: number; // open
  2: number; // high
  3: number; // low
  4: number; // close
  5?: number; // volume
}

export function processMarketData(rawCandles: RawCandle[]): OHLCData[] {
  if (!Array.isArray(rawCandles) || rawCandles.length === 0) {
    return [];
  }

  // Single pass transformation with index
  return rawCandles.map((candle, index) => ({
    timestamp: candle[0] * 1000, // Convert seconds to milliseconds
    open: candle[1],
    high: candle[2],
    low: candle[3],
    close: candle[4],
    volume: candle[5] || 0,
    time: candle[0], // Required by the chart component (timestamp)
    index: index, // Required by the chart component (index)
  }));
}
