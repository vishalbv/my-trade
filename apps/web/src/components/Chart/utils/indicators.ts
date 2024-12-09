import { OHLCData } from "../types";

export const calculateRSI = (
  data: OHLCData[],
  period: number = 14
): number[] => {
  const gains: number[] = [];
  const losses: number[] = [];
  const rsi: number[] = [];

  // Calculate price changes and separate gains/losses
  for (let i = 1; i < data.length; i++) {
    const change = data[i]!.close - data[i - 1]!.close;
    gains.push(Math.max(0, change));
    losses.push(Math.max(0, -change));
  }

  // Calculate initial averages
  let avgGain = gains.slice(0, period).reduce((a, b) => a + b, 0) / period;
  let avgLoss = losses.slice(0, period).reduce((a, b) => a + b, 0) / period;

  // First RSI value
  rsi.push(100 - 100 / (1 + avgGain / avgLoss));

  // Calculate subsequent values using Wilder's smoothing
  for (let i = period; i < data.length - 1; i++) {
    avgGain = (avgGain * (period - 1) + gains[i]!) / period;
    avgLoss = (avgLoss * (period - 1) + losses[i]!) / period;

    if (avgLoss === 0) {
      rsi.push(100);
    } else {
      rsi.push(100 - 100 / (1 + avgGain / avgLoss));
    }
  }

  return rsi;
};
