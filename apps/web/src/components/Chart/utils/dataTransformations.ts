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
      timestamp: candle[0] * 1000, // Convert to milliseconds
      open: candle[1],
      high: candle[2],
      low: candle[3],
      close: candle[4],
      index,
    }))
    .sort((a, b) => a.timestamp - b.timestamp);

  return transformedData;
}

export function createContinuousData(
  data: OHLCData[],
  timeInterval: number
): OHLCData[] {
  if (!data.length) return [];

  const baseTimestamp = data[0].timestamp;

  return data.map((candle, idx) => ({
    ...candle,
    timestamp: baseTimestamp + idx * timeInterval,
    index: idx,
  }));
}
