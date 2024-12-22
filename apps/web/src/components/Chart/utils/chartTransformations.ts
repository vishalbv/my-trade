import { ChartTheme } from "../types";

interface CandleData {
  close: number;
  time: number;
  timestamp: number;
  open: number;
  high: number;
  low: number;
  volume: number;
  index: number;
}

interface TransformedData {
  price: number;
  color: string;
  label: string;
  data: Array<{
    time: number;
    value: number;
  }>;
}

// Move formatChartTime to the top
const formatChartTime = (timestamp: number): number => {
  // Add 5 hours and 30 minutes (in seconds)
  // 5 hours = 5 * 60 * 60 = 18000 seconds
  // 30 minutes = 30 * 60 = 1800 seconds
  return timestamp + 18000 + 1800;
};

export const transformPriceData = (
  data: CandleData[],
  color: string,
  label: string
): TransformedData | null => {
  if (!data?.length) return null;
  return {
    price: data[0]?.close || 0,
    color,
    label,
    data: data.map((item) => ({
      time: formatChartTime(item.time),
      value: item.close,
    })),
  };
};

export const transformPercentageChangeData = (
  data: CandleData[],
  color: string,
  label: string
): TransformedData | null => {
  if (!data?.length) return null;

  const percentageData = data.map((item, index) => {
    if (index === 0) {
      return {
        time: formatChartTime(item.time),
        value: 0,
      };
    }

    const previousClose = data[index - 1].close;
    const percentageChange =
      ((item.close - previousClose) / previousClose) * 100;

    return {
      time: formatChartTime(item.time),
      value: Number(percentageChange.toFixed(2)),
    };
  });

  return {
    price: data[0]?.close || 0,
    color,
    label,
    data: percentageData,
  };
};

interface RelativeMovementOptions {
  ceData: CandleData[];
  peData: CandleData[];
  indexData: CandleData[];
  currentTheme: ChartTheme;
}

export const transformRelativeMovement = ({
  ceData,
  peData,
  indexData,
  currentTheme,
}: RelativeMovementOptions): TransformedData[] | null => {
  if (!ceData?.length || !peData?.length || !indexData?.length) return null;

  // Calculate initial offsets
  const ceInitialPrice = ceData.at(-50)?.close || 0;
  const peInitialPrice = peData.at(-50)?.close || 0;
  const indexInitialPrice = indexData.at(-50)?.close || 0;

  // Calculate offsets to align starting points
  const ceOffset = indexInitialPrice - ceInitialPrice;
  const peOffset = indexInitialPrice - peInitialPrice;

  // Transform CE relative to index
  const ceRelative: TransformedData = {
    price: ceInitialPrice,
    color: currentTheme.upColor,
    label: "CE vs Index",
    data: ceData.map((item) => ({
      time: formatChartTime(item.time),
      value: item.close + ceOffset,
    })),
  };

  // Transform PE relative to index (inversed)
  const peRelative: TransformedData = {
    price: peInitialPrice,
    color: currentTheme.downColor,
    label: "PE vs Index",
    data: peData.map((item) => {
      const alignedPrice = item.close + peOffset;
      // Inverse the movement relative to the index
      const inversedValue =
        indexInitialPrice + (indexInitialPrice - alignedPrice);
      return {
        time: formatChartTime(item.time),
        value: inversedValue,
      };
    }),
  };

  // Transform index as reference
  const indexTransformed: TransformedData = {
    price: indexInitialPrice,
    color: currentTheme.text,
    label: "Index",
    data: indexData.map((item) => ({
      time: formatChartTime(item.time),
      value: item.close,
    })),
  };

  return [ceRelative, peRelative, indexTransformed];
};

export const transformPremiumIndexCorrelation = ({
  ceData,
  peData,
  indexData,
  currentTheme,
}: {
  ceData: CandleData[];
  peData: CandleData[];
  indexData: CandleData[];
  currentTheme: ChartTheme;
}) => {
  if (!ceData.length || !peData.length || !indexData.length) return null;

  // Create timestamp-indexed maps for quick lookup
  const ceMap = new Map(ceData.map((candle) => [candle.time, candle]));
  const peMap = new Map(peData.map((candle) => [candle.time, candle]));
  const indexMap = new Map(indexData.map((candle) => [candle.time, candle]));

  // Get base values from -50 index
  const baseIndexPrice = indexData.at(-50)?.close;
  const baseCEPrice = ceData.at(-50)?.close;
  const basePEPrice = peData.at(-50)?.close;

  if (!baseIndexPrice || !baseCEPrice || !basePEPrice) return null;

  // Get all unique timestamps
  const allTimestamps = [
    ...new Set([...ceMap.keys(), ...peMap.keys(), ...indexMap.keys()]),
  ];

  // Create correlation data points
  const dataPoints = allTimestamps
    .map((timestamp) => {
      const indexCandle = indexMap.get(timestamp);
      const ceCandle = ceMap.get(timestamp);
      const peCandle = peMap.get(timestamp);

      if (!indexCandle || !ceCandle || !peCandle) return null;

      // Calculate normalized changes relative to index
      const indexChange =
        ((indexCandle.close - baseIndexPrice) / baseIndexPrice) * 100;

      // Normalize option changes using price ratios
      const normalizedCEChange =
        ((ceCandle.close - baseCEPrice) /
          (baseCEPrice * (baseIndexPrice / baseCEPrice))) *
        100;
      const normalizedPEChange =
        ((peCandle.close - basePEPrice) /
          (basePEPrice * (baseIndexPrice / basePEPrice))) *
        100;

      // For CE:
      // Positive when CE premium increases more than index increase (or decreases less than index decrease)
      // Negative when CE premium decreases more than index decrease (or increases less than index increase)
      const ceCorrelation = normalizedCEChange - Math.abs(indexChange);

      // For PE:
      // Positive when PE premium increases while index decreases (or decreases while index increases)
      // Negative when PE premium moves in same direction as index
      const peCorrelation = normalizedPEChange - -indexChange;

      return {
        timestamp,
        ceCorrelation,
        peCorrelation,
      };
    })
    .filter(Boolean);

  // Remove the offset constants
  const ceCorrelationSeries = {
    name: "CE",
    label: "CE",
    color: currentTheme.upColor,
    priceScaleId: "ce_scale",
    data: dataPoints.map((point) => ({
      // Format time here before sending to chart
      time: formatChartTime(point!.timestamp),
      value: point!.ceCorrelation,
    })),
  };

  const peCorrelationSeries = {
    name: "PE",
    label: "PE",
    color: currentTheme.downColor,
    priceScaleId: "pe_scale",
    data: dataPoints.map((point) => ({
      // Format time here before sending to chart
      time: formatChartTime(point!.timestamp),
      value: point!.peCorrelation,
    })),
  };

  return [ceCorrelationSeries, peCorrelationSeries];
};
