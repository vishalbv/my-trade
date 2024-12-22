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
  const date = new Date(timestamp * 1000);
  // Convert to UTC to avoid timezone issues
  const hours = date.getHours();
  const minutes = date.getMinutes();
  // Create a new UTC date with just hours and minutes
  const formattedDate = new Date(Date.UTC(1970, 0, 1, hours, minutes));
  return formattedDate.getTime() / 1000;
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
}

export const transformRelativeMovement = ({
  ceData,
  peData,
  indexData,
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
    color: "#2962FF",
    label: "CE vs Index",
    data: ceData.map((item) => ({
      time: formatChartTime(item.time),
      value: item.close + ceOffset,
    })),
  };

  // Transform PE relative to index (inversed)
  const peRelative: TransformedData = {
    price: peInitialPrice,
    color: "#FF2962",
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
    color: "#29FF62",
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
}: {
  ceData: CandleData[];
  peData: CandleData[];
  indexData: CandleData[];
}) => {
  if (!ceData.length || !peData.length || !indexData.length) return null;

  // Find the latest common timestamp
  const latestTimestamp = Math.min(
    ceData[ceData.length - 1].time,
    peData[peData.length - 1].time,
    indexData[indexData.length - 1].time
  );

  // Create timestamp-indexed maps for quick lookup
  const ceMap = new Map(ceData.map((candle) => [candle.time, candle]));
  const peMap = new Map(peData.map((candle) => [candle.time, candle]));
  const indexMap = new Map(indexData.map((candle) => [candle.time, candle]));

  // Get all unique timestamps and sort them
  const allTimestamps = [
    ...new Set([...ceMap.keys(), ...peMap.keys(), ...indexMap.keys()]),
  ]
    .filter((timestamp) => timestamp <= latestTimestamp)
    .sort((a, b) => a - b);

  // Find the first timestamp where we have data for all three
  const firstValidTimestamp = allTimestamps.find(
    (timestamp) =>
      ceMap.has(timestamp) && peMap.has(timestamp) && indexMap.has(timestamp)
  );

  if (!firstValidTimestamp) return null;

  // Get base values from first valid timestamp
  const baseIndexPrice = indexMap.get(firstValidTimestamp)!.close;
  const baseCEPrice = ceMap.get(firstValidTimestamp)!.close;
  const basePEPrice = peMap.get(firstValidTimestamp)!.close;

  // Calculate price ratios for scaling
  const ceToIndexRatio = baseCEPrice / baseIndexPrice;
  const peToIndexRatio = basePEPrice / baseIndexPrice;

  // Create correlation data points
  const dataPoints = allTimestamps
    .filter((timestamp) => timestamp >= firstValidTimestamp)
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
        ((ceCandle.close - baseCEPrice) / (baseCEPrice * ceToIndexRatio)) * 100;
      const normalizedPEChange =
        ((peCandle.close - basePEPrice) / (basePEPrice * peToIndexRatio)) * 100;

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
    name: "CE Premium Correlation",
    label: "CE Premium Correlation",
    color: "#2962FF",
    priceScaleId: "ce_scale",
    data: dataPoints.map((point) => ({
      // Format time here before sending to chart
      time: formatChartTime(point!.timestamp),
      value: point!.ceCorrelation,
    })),
  };

  const peCorrelationSeries = {
    name: "PE Premium Correlation",
    label: "PE Premium Correlation",
    color: "#29FF62",
    priceScaleId: "pe_scale",
    data: dataPoints.map((point) => ({
      // Format time here before sending to chart
      time: formatChartTime(point!.timestamp),
      value: point!.peCorrelation,
    })),
  };

  return [ceCorrelationSeries, peCorrelationSeries];
};
