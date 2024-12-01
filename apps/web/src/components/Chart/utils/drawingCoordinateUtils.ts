import { Drawing, Point, OHLCData } from "../types";

// Convert timestamp to data index
export const findDataIndexFromTimestamp = (
  timestamp: number,
  data: OHLCData[]
): number => {
  // Binary search for better performance with large datasets
  let left = 0;
  let right = data.length - 1;

  while (left <= right) {
    const mid = Math.floor((left + right) / 2);
    const midTimestamp = data[mid]?.timestamp;

    if (midTimestamp === timestamp) {
      return mid + 0.5;
    }

    if (midTimestamp < timestamp) {
      left = mid + 1;
    } else {
      right = mid - 1;
    }
  }

  return Math.min(left, data.length - 1) + 0.5;
};

// Convert data index to timestamp
export const findTimestampFromDataIndex = (
  index: number,
  data: OHLCData[]
): number => {
  // Subtract 0.5 to get back to candle start index
  const adjustedIndex = Math.floor(index - 0.5);

  if (adjustedIndex < 0) return data[0]?.timestamp || Date.now();
  if (adjustedIndex >= data.length)
    return data[data.length - 1]?.timestamp || Date.now();

  return data[adjustedIndex]?.timestamp || Date.now();
};

// Convert drawing points from timestamp to data index coordinates
export const convertDrawingToDataIndex = (
  drawing: Drawing,
  data: OHLCData[]
): Drawing => {
  return {
    ...drawing,
    points: drawing.points.map((point) => ({
      x: findDataIndexFromTimestamp(point.x, data),
      y: point.y,
    })),
  };
};

// Convert drawing points from data index to timestamp coordinates
export const convertDrawingToTimestamp = (
  drawing: Drawing,
  data: OHLCData[]
): Drawing => {
  return {
    ...drawing,
    points: drawing.points.map((point) => ({
      x: findTimestampFromDataIndex(point.x, data),
      y: point.y,
    })),
  };
};

// Convert array of drawings
export const convertDrawingsToDataIndex = (
  drawings: Drawing[],
  data: OHLCData[]
): Drawing[] => {
  return drawings.map((drawing) => convertDrawingToDataIndex(drawing, data));
};

export const convertDrawingsToTimestamp = (
  drawings: Drawing[],
  data: OHLCData[]
): Drawing[] => {
  return drawings.map((drawing) => convertDrawingToTimestamp(drawing, data));
};
