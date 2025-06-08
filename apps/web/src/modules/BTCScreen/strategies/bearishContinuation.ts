import { EMA } from "technicalindicators";
import { OHLCData } from "../../../services/deltaExchange";

interface Signal {
  index: number;
  timestamp: number;
  price: number;
  message: string;
}

interface Drawing {
  id: string;
  type: "circle";
  points: { x: number; y: number }[];
  color: string;
  symbol: string;
  visible?: boolean;
  isDrawnByApp?: boolean;
  style?: {
    strokeColor: string;
    strokeWidth: number;
    fillColor: string;
  };
}

// Calculate EMA values with memoization
let lastCalculatedEMA: {
  candles: OHLCData[];
  ema50: number[];
  ema200: number[];
} | null = null;

function calculateEMAs(candles: OHLCData[]): {
  ema50: number[];
  ema200: number[];
} {
  // Return cached result if using same candles
  if (lastCalculatedEMA && lastCalculatedEMA.candles === candles) {
    return {
      ema50: lastCalculatedEMA.ema50,
      ema200: lastCalculatedEMA.ema200,
    };
  }

  const closes = candles.map((c) => c.close);
  const ema50 = EMA.calculate({
    period: 50,
    values: closes,
  });
  const ema200 = EMA.calculate({
    period: 200,
    values: closes,
  });

  // Cache the result
  lastCalculatedEMA = {
    candles,
    ema50,
    ema200,
  };

  return { ema50, ema200 };
}

// Add this function before detectBearishContinuation
function calculateSlope(candles: OHLCData[]): number {
  const n = candles.length;
  let sumX = 0;
  let sumY = 0;
  let sumXY = 0;
  let sumXX = 0;

  // Use closing prices for Y values
  const prices = candles.map((c) => c.close);

  // Calculate means and sums
  for (let i = 0; i < n; i++) {
    sumX += i;
    sumY += prices[i];
    sumXY += i * prices[i];
    sumXX += i * i;
  }

  const meanX = sumX / n;
  const meanY = sumY / n;

  // Calculate slope using least squares method
  const slope = (sumXY - sumX * meanY) / (sumXX - sumX * meanX);

  // Normalize the slope by the average price to get a percentage
  const avgPrice = meanY;
  const normalizedSlope = (slope / avgPrice) * 100;

  return normalizedSlope;
}

// Add this function before detectBearishContinuation
function hasNoSignificantSwings(
  candles: OHLCData[],
  threshold: number = 0.003
): boolean {
  if (candles.length < 2) return true;

  // Calculate percentage changes between consecutive candles
  for (let i = 1; i < candles.length; i++) {
    const prevCandle = candles[i - 1];
    const currentCandle = candles[i];

    // Calculate swing as percentage of price range compared to previous candle
    const prevRange = Math.abs(prevCandle.high - prevCandle.low);
    const currentRange = Math.abs(currentCandle.high - currentCandle.low);
    const avgPrice = (currentCandle.close + prevCandle.close) / 2;

    // Calculate relative swing size
    const swingSize = Math.abs(currentRange - prevRange) / avgPrice;

    // If swing is larger than threshold, return false
    if (swingSize > threshold) {
      return false;
    }

    // Check for sudden direction changes
    const prevTrend = prevCandle.close - prevCandle.open;
    const currentTrend = currentCandle.close - currentCandle.open;

    // If there's a sharp reversal (from strong up to strong down or vice versa)
    if (
      Math.sign(prevTrend) !== Math.sign(currentTrend) &&
      Math.abs(currentTrend / avgPrice) > threshold &&
      Math.abs(prevTrend / avgPrice) > threshold
    ) {
      return false;
    }
  }

  return true;
}

export function detectBearishContinuation(candles: OHLCData[]): Drawing[] {
  const signals: Signal[] = [];
  const drawings: Drawing[] = [];

  // Debug log
  console.log("Starting pattern detection with candles:", candles.length);

  // Return early if not enough data
  if (candles.length < 201) {
    console.log("Not enough candles, need at least 201");
    return drawings;
  }

  // Calculate EMAs once
  const { ema50, ema200 } = calculateEMAs(candles);
  console.log("EMAs calculated:", {
    ema50Length: ema50.length,
    ema200Length: ema200.length,
  });

  // Only process the last 100 candles for performance
  // const startIndex = Math.max(200, candles.length - 100);
  const startIndex = Math.max(200);
  console.log("Processing candles from index:", startIndex);

  for (let i = startIndex; i < candles.length; i++) {
    const firstRed = candles[i - 2];
    const green = candles[i - 1];
    const secondRed = candles[i];

    // Skip if any candle is undefined
    if (!firstRed || !green || !secondRed) {
      console.log("Missing candle data at index:", i);
      continue;
    }

    // Skip if EMAs are not available
    const ema50Index = i - (candles.length - ema50.length);
    const ema200Index = i - (candles.length - ema200.length);

    if (ema50Index < 0 || ema200Index < 0 || !ema50[ema50Index]) {
      console.log("Invalid EMA indices at candle:", i);
      continue;
    }

    // Candle pattern characteristics
    const isFirstRed = firstRed.close < firstRed.open;
    const isGreen = green.close > green.open;
    const isSecondRed = secondRed.close < secondRed.open;

    // Calculate candle sizes
    const firstRedBody = Math.abs(firstRed.close - firstRed.open);
    const greenBody = Math.abs(green.close - green.open);
    const secondRedBody = Math.abs(secondRed.close - secondRed.open);

    // Pattern conditions
    const hasRedGreenRedPattern = isFirstRed && isGreen && isSecondRed;
    const greenIsSmallerThanReds =
      greenBody < firstRedBody * 0.8 && greenBody < secondRedBody * 0.8;

    // Check if red candles are significant
    const firstRedCandleSize =
      ((firstRed.high - firstRed.low) / firstRed.open) * 100;
    const secondRedCandleSize =
      ((secondRed.high - secondRed.low) / secondRed.open) * 100;
    const areRedCandlesSignificant =
      firstRedCandleSize > 0.1 && secondRedCandleSize > 0.1;

    // Price below EMAs
    const price = secondRed.close;
    const isBelowEMAs = price <= ema50[ema50Index];

    // Check if current price is lower than previous 100 candles
    const lookbackCandles = candles.slice(Math.max(0, i - 100), i);
    const higherPriceCount = lookbackCandles.filter(
      (c) => c.close > price
    ).length;
    const isPriceLowerThanHistory = higherPriceCount >= 80; // At least 80% of previous candles should be higher

    // Volume analysis
    const volumeRatio =
      green.volume / ((firstRed.volume + secondRed.volume) / 2);
    const isVolumeWeak = volumeRatio < 0.9;

    // Simplified downtrend check
    const lookbackPeriod = 3;
    const pricesBefore = candles.slice(i - lookbackPeriod - 1, i - 1);
    const isDowntrend = pricesBefore.some((c, index, arr) => {
      if (index === 0 || !c || !arr[index - 1]) return true;
      const prev = arr[index - 1];
      return prev && c.high < prev.high;
    });

    // Check for smooth price movement in last 15 candles
    const last15Candles = candles.slice(i - 10, i);
    const hasSmooth15CandleMovement = hasNoSignificantSwings(last15Candles);

    // Calculate slope of last 20 candles
    const last20Candles = candles.slice(i - 20, i);
    const slope = calculateSlope(last20Candles);
    console.log("Slope:", slope);
    const hasStrongDownwardSlope = slope <= -0.02; // Negative slope indicates downward trend

    // Calculate the middle point of the three-candle pattern
    const patternHighest = Math.max(firstRed.high, green.high, secondRed.high);
    const patternLowest = Math.min(firstRed.low, green.low, secondRed.low);
    const patternRange = patternHighest - patternLowest;
    const middleOfPattern = patternLowest + patternRange / 2;

    // Check if any candle body crosses below the middle of the pattern
    // Skip the 4 candles just before firstRed (i-2) by starting at i-6
    const lookbackForLow = candles.slice(i - 100, i - 6); // Look back 100 candles but skip last 4 before pattern
    const hasLowerBodies = lookbackForLow.some(
      (candle) => Math.min(candle.open, candle.close) < middleOfPattern
    );

    console.log("Pattern middle check:", {
      patternHighest,
      patternLowest,
      patternRange,
      middleOfPattern,
      hasLowerBodies,
      lookbackStartIndex: i - 100,
      lookbackEndIndex: i - 6,
      candlesChecked: lookbackForLow.length,
    });

    // Check bottom wick size of last red candle
    const lastRedBodyLow = Math.min(secondRed.open, secondRed.close);
    const lastRedBodyHigh = Math.max(secondRed.open, secondRed.close);
    const totalCandleHeight = secondRed.high - secondRed.low;
    const bottomWickSize = lastRedBodyLow - secondRed.low;
    const bottomWickRatio = bottomWickSize / totalCandleHeight;
    const hasAcceptableWick = bottomWickRatio <= 0.5;

    // Log pattern conditions
    console.log("Pattern conditions for candle", i, {
      hasRedGreenRedPattern,
      greenIsSmallerThanReds,
      areRedCandlesSignificant,
      isBelowEMAs,
      hasLowerBodies,
      bottomWickRatio,
      hasAcceptableWick,
      firstRedCandleSize,
      secondRedCandleSize,
      volumeRatio,
      currentPrice: price,
      ema50: ema50[ema50Index],
      time: secondRed.time,
      candleData: secondRed,
    });

    if (
      hasRedGreenRedPattern &&
      greenIsSmallerThanReds &&
      areRedCandlesSignificant &&
      isBelowEMAs &&
      !hasLowerBodies &&
      hasAcceptableWick
    ) {
      console.log("Pattern found at index:", i, "with time:", green.time);

      drawings.push({
        id: `pattern-circle-bottom-${green.timestamp}`,
        type: "circle",
        isDrawnByApp: true,
        points: [
          { x: green.timestamp, y: green.high }, // Center point
          { x: green.timestamp + 1, y: green.high }, // Dummy radius point
        ],
        visible: true,
        extraStyles: {
          stroke: "rgba(0, 255, 0, 0.8)", // Green stroke
          strokeWidth: 1,
          fill: "rgba(255, 0, 0, 0.1)", // Light red fill
        },
      });
    }
  }

  console.log("Total patterns found:", drawings.length);
  return drawings;
}
