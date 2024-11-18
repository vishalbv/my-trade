import { OHLCData } from "../types";

interface RawCandle {
  0: number; // timestamp
  1: number; // open
  2: number; // high
  3: number; // low
  4: number; // close
}

export function processMarketData(rawCandles: RawCandle[]): OHLCData[] {
  if (!Array.isArray(rawCandles) || rawCandles.length === 0) {
    return [];
  }

  // Transform and sort data
  const transformedData = rawCandles
    .map((candle, index) => ({
      timestamp: new Date(new Date(0).setUTCSeconds(candle[0])), // Convert to milliseconds
      open: candle[1],
      high: candle[2],
      low: candle[3],
      close: candle[4],
      index, // Add index for x-axis scaling
    }))
    .sort((a, b) => a.timestamp - b.timestamp)
    // Reindex after sorting
    .map((candle, index) => ({
      ...candle,
      index,
    }));

  return transformedData;
}

export function createContinuousData(
  data: OHLCData[],
  timeInterval: number
): OHLCData[] {
  if (!data.length) return [];

  // Keep original timestamps but ensure indices are continuous
  return data.map((candle, idx) => ({
    ...candle,
    index: idx,
  }));
}
