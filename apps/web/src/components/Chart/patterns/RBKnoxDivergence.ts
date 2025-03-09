import { Drawing, OHLCData } from "../types";

export const calculateRBKnoxDivergence = (chartData: OHLCData[]): Drawing[] => {
  const drawings: Drawing[] = [];
  const length = 14; // RSI period
  const divergenceLength = 8; // Number of candles to look back for divergence
  const rsiThreshold = 5; // Minimum RSI difference to consider
  const priceThreshold = 0.1; // Minimum 0.1% price difference to consider

  if (!chartData || chartData.length < length + divergenceLength) return [];

  // Calculate RSI
  const calculateRSI = (data: OHLCData[], period: number): number[] => {
    let gains: number[] = [];
    let losses: number[] = [];
    let rsi: number[] = [];

    for (let i = 1; i < data.length; i++) {
      const currentClose = data[i]?.close || 0;
      const prevClose = data[i - 1]?.close || 0;
      const change = currentClose - prevClose;
      gains.push(change > 0 ? change : 0);
      losses.push(change < 0 ? Math.abs(change) : 0);
    }

    let avgGain = gains.slice(0, period).reduce((a, b) => a + b, 0) / period;
    let avgLoss = losses.slice(0, period).reduce((a, b) => a + b, 0) / period;

    // Prevent division by zero
    avgLoss = avgLoss === 0 ? 0.000001 : avgLoss;

    for (let i = period; i < data.length; i++) {
      const rs = avgGain / avgLoss;
      rsi.push(100 - 100 / (1 + rs));

      const currentGain = gains[i] || 0;
      const currentLoss = losses[i] || 0;
      avgGain = (avgGain * (period - 1) + currentGain) / period;
      avgLoss = (avgLoss * (period - 1) + currentLoss) / period;
      avgLoss = avgLoss === 0 ? 0.000001 : avgLoss;
    }

    return rsi;
  };

  const rsiValues = calculateRSI(chartData, length);
  let lastBullishIndex = -divergenceLength * 2;
  let lastBearishIndex = -divergenceLength * 2;

  // Find divergences
  for (let i = divergenceLength; i < chartData.length - 1; i++) {
    const current = chartData[i];
    const previous = chartData[i - divergenceLength];
    const currentRsi = rsiValues[i];
    const previousRsi = rsiValues[i - divergenceLength];

    if (
      !current ||
      !previous ||
      typeof currentRsi === "undefined" ||
      typeof previousRsi === "undefined"
    ) {
      continue;
    }

    // Calculate percentage changes
    const pricePctChange = Math.abs(
      ((current.low - previous.low) / previous.low) * 100
    );
    const rsiDiff = Math.abs(currentRsi - previousRsi);

    // Bullish Divergence
    if (
      current.low < previous.low &&
      currentRsi > previousRsi &&
      rsiDiff > rsiThreshold &&
      pricePctChange > priceThreshold &&
      i - lastBullishIndex > divergenceLength // Prevent overlapping signals
    ) {
      const drawing: Drawing = {
        id: `rbknox-bullish-${i}`,
        type: "trendline",
        isDrawnByApp: true,
        points: [
          { x: previous.timestamp, y: previous.low },
          { x: current.timestamp, y: current.low },
        ],
        visible: true,
        extraStyles: {
          stroke: "rgba(0, 255, 0, 0.5)",
          strokeWidth: 2,
          dashArray: [5, 5],
        },
      };
      drawings.push(drawing);
      lastBullishIndex = i;
    }

    // Calculate percentage changes for bearish divergence
    const highPricePctChange = Math.abs(
      ((current.high - previous.high) / previous.high) * 100
    );

    // Bearish Divergence
    if (
      current.high > previous.high &&
      currentRsi < previousRsi &&
      rsiDiff > rsiThreshold &&
      highPricePctChange > priceThreshold &&
      i - lastBearishIndex > divergenceLength // Prevent overlapping signals
    ) {
      const drawing: Drawing = {
        id: `rbknox-bearish-${i}`,
        type: "trendline",
        isDrawnByApp: true,
        points: [
          { x: previous.timestamp, y: previous.high },
          { x: current.timestamp, y: current.high },
        ],
        visible: true,
        extraStyles: {
          stroke: "rgba(255, 0, 0, 0.5)",
          strokeWidth: 2,
          dashArray: [5, 5],
        },
      };
      drawings.push(drawing);
      lastBearishIndex = i;
    }
  }

  return drawings;
};
