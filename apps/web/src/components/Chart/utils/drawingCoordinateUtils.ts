import { Drawing, Point, OHLCData } from "../types";

// Convert timestamp to data index
export const findDataIndexFromTimestamp = (
  timestamp: number,
  data: OHLCData[]
): number => {
  if (!data.length) return 0;

  // Binary search for better performance with large datasets
  let left = 0;
  let right = data.length - 1;

  while (left <= right) {
    const mid = Math.floor((left + right) / 2);
    const midTimestamp = data[mid]?.timestamp;

    if (!midTimestamp) continue;

    if (midTimestamp === timestamp) {
      // Return exact index when found
      return mid;
    }

    if (midTimestamp < timestamp) {
      left = mid + 1;
    } else {
      right = mid - 1;
    }
  }

  // If not exact match, calculate fractional position
  if (left > 0 && left < data.length) {
    const leftTimestamp = data[left - 1]?.timestamp || 0;
    const rightTimestamp = data[left]?.timestamp || 0;
    const timestampRange = rightTimestamp - leftTimestamp;
    if (timestampRange > 0) {
      const fraction = (timestamp - leftTimestamp) / timestampRange;
      return left - 1 + fraction;
    }
  }

  return Math.min(left, data.length - 1);
};

// Convert data index to timestamp
export const findTimestampFromDataIndex = (
  index: number,
  data: OHLCData[]
): number => {
  if (!data.length) return Date.now();

  const floorIndex = Math.floor(index);
  const fraction = index - floorIndex;

  // Handle exact indices
  if (fraction === 0) {
    return data[floorIndex]?.timestamp || Date.now();
  }

  // Handle fractional indices by interpolating between timestamps
  if (floorIndex >= 0 && floorIndex < data.length - 1) {
    const leftTimestamp = data[floorIndex]?.timestamp || 0;
    const rightTimestamp = data[floorIndex + 1]?.timestamp || 0;
    return leftTimestamp + (rightTimestamp - leftTimestamp) * fraction;
  }

  // Handle edge cases
  if (floorIndex < 0) return data[0]?.timestamp || Date.now();
  return data[data.length - 1]?.timestamp || Date.now();
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


export const round = (value: number, step: number) => {
  step || (step = 1.0);
  var inv = 1.0 / step;
  return Math.round(value * inv) / inv;
}