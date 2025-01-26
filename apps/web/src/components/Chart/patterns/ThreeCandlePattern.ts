import { Drawing, OHLCData } from "../types";

export const findThreeCandlePattern = (chartData: OHLCData[]): Drawing[] => {
  if (!chartData || chartData.length < 3) return [];

  const patternDrawings: Drawing[] = [];

  // Iterate through the data, looking at 3 candles at a time
  for (let i = 0; i < chartData.length - 2; i++) {
    const candle1 = chartData[i];
    const candle2 = chartData[i + 1];
    const candle3 = chartData[i + 2];

    if (!candle1 || !candle2 || !candle3) continue;

    // Bottom pattern conditions (Bullish)
    const isMiddleLowest =
      candle2.low < candle1.low && candle2.low < candle3.low;

    const isThirdLowerThanFirst = candle3.low < candle1.low;

    const isThirdGreen = candle3.close > candle3.open;

    const thirdCandleBody = Math.abs(candle3.close - candle3.open);
    const secondCandleBody = Math.abs(candle2.close - candle2.open);
    const isThirdBodyLarger = thirdCandleBody > secondCandleBody;

    const isThirdHigherThanSecond = candle3.high > candle2.high;

    // Top pattern conditions (Bearish)
    const isMiddleHighest =
      candle2.high > candle1.high && candle2.high > candle3.high;

    const isThirdHigherThanFirstTop = candle3.high > candle1.high;

    const isThirdRed = candle3.close < candle3.open;

    const isThirdLowerThanSecondTop = candle3.low < candle2.low;

    // Check and draw bottom pattern (Bullish - Green)
    if (
      isMiddleLowest &&
      isThirdLowerThanFirst &&
      isThirdGreen &&
      isThirdBodyLarger &&
      isThirdHigherThanSecond
    ) {
      const centerX = candle2.timestamp;
      const centerY = candle2.low;

      const circleDrawing: Drawing = {
        id: `pattern-circle-bottom-${centerX}`,
        type: "circle",
        isDrawnByApp: true,
        points: [
          { x: centerX, y: centerY }, // Center point
          { x: centerX + 1, y: centerY }, // Dummy radius point
        ],
        visible: true,
        extraStyles: {
          stroke: "rgba(0, 255, 0, 0.8)", // Green stroke
          strokeWidth: 1,
          fill: "rgba(0, 255, 0, 0.1)", // Light green fill
        },
      };

      patternDrawings.push(circleDrawing);
    }

    // Check and draw top pattern (Bearish - Red)
    if (
      isMiddleHighest &&
      isThirdHigherThanFirstTop &&
      isThirdRed &&
      isThirdBodyLarger &&
      isThirdLowerThanSecondTop
    ) {
      const centerX = candle2.timestamp;
      const centerY = candle2.high;

      const circleDrawing: Drawing = {
        id: `pattern-circle-top-${centerX}`,
        type: "circle",
        isDrawnByApp: true,
        points: [
          { x: centerX, y: centerY }, // Center point
          { x: centerX + 1, y: centerY }, // Dummy radius point
        ],
        visible: true,
        extraStyles: {
          stroke: "rgba(255, 0, 0, 0.8)", // Red stroke
          strokeWidth: 1,
          fill: "rgba(255, 0, 0, 0.1)", // Light red fill
        },
      };

      patternDrawings.push(circleDrawing);
    }
  }

  return patternDrawings;
};
