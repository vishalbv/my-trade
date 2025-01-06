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
  return timestamp / 1000 + 18000 + 1800;
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
      time: formatChartTime(item.timestamp),
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
        time: formatChartTime(item.timestamp),
        value: 0,
      };
    }

    const previousClose = data[index - 1].close;
    const percentageChange =
      ((item.close - previousClose) / previousClose) * 100;

    return {
      time: formatChartTime(item.timestamp),
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
    label: "CE",
    data: ceData.map((item) => ({
      time: formatChartTime(item.timestamp),
      value: item.close + ceOffset,
    })),
  };

  // Transform PE relative to index (inversed)
  const peRelative: TransformedData = {
    price: peInitialPrice,
    color: currentTheme.downColor,
    label: "PE",
    data: peData.map((item) => {
      const alignedPrice = item.close + peOffset;
      // Inverse the movement relative to the index
      // const inversedValue =
      //   indexInitialPrice + (indexInitialPrice - alignedPrice);
      return {
        time: formatChartTime(item.timestamp),
        value: alignedPrice,
      };
    }),
  };

  // Transform index as reference
  const indexTransformed: TransformedData = {
    price: indexInitialPrice,
    color: currentTheme.text,
    label: "INDEX",
    data: indexData.map((item) => ({
      time: formatChartTime(item.timestamp),
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
  const ceMap = new Map(ceData.map((candle) => [candle.timestamp, candle]));
  const peMap = new Map(peData.map((candle) => [candle.timestamp, candle]));
  const indexMap = new Map(
    indexData.map((candle) => [candle.timestamp, candle])
  );

  // Get all unique timestamps
  const allTimestamps = [
    ...new Set([...ceMap.keys(), ...peMap.keys(), ...indexMap.keys()]),
  ];

  // Create data points showing premium to index price ratio
  const dataPoints = allTimestamps
    .map((timestamp) => {
      const currentCE = ceMap.get(timestamp);
      const currentPE = peMap.get(timestamp);
      const currentIndex = indexMap.get(timestamp);

      if (!currentCE || !currentPE || !currentIndex) return null;

      // Calculate simple ratios of premium prices to index price
      const ceRatio = (currentCE.close / (currentIndex.close - 23400)) * 100;
      const peRatio = (currentPE.close / (currentIndex.close - 23400)) * 100;

      return {
        timestamp,
        ceRatio,
        peRatio,
      };
    })
    .filter(Boolean);

  const cePremiumSeries = {
    name: "CE Premium Ratio",
    label: "CE Premium Ratio",
    color: currentTheme.upColor,
    priceScaleId: "ce_scale",
    scalePosition: "right",
    data: dataPoints.map((point) => ({
      time: formatChartTime(point!.timestamp),
      value: point!.ceRatio,
    })),
  };

  const pePremiumSeries = {
    name: "PE Premium Ratio",
    label: "PE Premium Ratio",
    color: currentTheme.downColor,
    priceScaleId: "pe_scale",
    scalePosition: "left",
    data: dataPoints.map((point) => ({
      time: formatChartTime(point!.timestamp),
      value: point!.peRatio,
    })),
  };

  return [cePremiumSeries, pePremiumSeries];
};
