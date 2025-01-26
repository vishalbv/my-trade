import { Drawing, OHLCData } from "../types";

export const calculateSwingAreas = (chartData: OHLCData[]): Drawing[] => {
  const swingsLength = 15;

  if (!chartData || chartData.length < swingsLength * 2) return [];
  const swingDrawings: Drawing[] = [];

  // Function to check if a point is a swing low
  const isSwingLow = (index: number, data: OHLCData[]): boolean => {
    if (index < swingsLength || index > data.length - swingsLength)
      return false;

    const currentLow = data[index]?.low;
    let isLowest = true;

    // Check left side
    for (let i = 1; i <= swingsLength; i++) {
      if (data[index - i]?.low! < currentLow!) {
        isLowest = false;
        break;
      }
    }

    // If lowest on left side, check right side
    if (isLowest) {
      for (let i = 1; i <= swingsLength; i++) {
        if (data[index + i]?.low! < currentLow!) {
          isLowest = false;
          break;
        }
      }
    }

    return isLowest;
  };

  // Function to check if a point is a swing high
  const isSwingHigh = (index: number, data: OHLCData[]): boolean => {
    if (index < swingsLength || index > data.length - swingsLength)
      return false;

    const currentHigh = data[index]?.high;

    for (let i = index - swingsLength; i <= index + swingsLength; i++) {
      if (i === index) continue;
      if (data[i]?.high! > currentHigh!) return false;
    }
    return true;
  };

  // Function to calculate swings for a specific data range
  const calculateSwingsForRange = (data: OHLCData[], rangeLabel: string) => {
    const swingLows: { index: number; price: number; date: number }[] = [];
    const swingHighs: { index: number; price: number; date: number }[] = [];

    // Find all swing points
    for (let i = swingsLength; i < data.length - swingsLength; i++) {
      const actualIndex = chartData.length - data.length + i;

      if (isSwingLow(i, data)) {
        swingLows.push({
          index: actualIndex,
          price: data[i]?.low!,
          date: data[i]?.timestamp!,
        });
      }
      if (isSwingHigh(i, data)) {
        swingHighs.push({
          index: actualIndex,
          price: data[i]?.high!,
          date: data[i]?.timestamp!,
        });
      }
    }

    // Handle support area
    const sortedSwingLows = [...swingLows].sort((a, b) => a.price - b.price);

    const drawSupportLine = (point: { timestamp: number; low: number }) => {
      const supportLine: Drawing = {
        id: "drawing-" + Date.now().toString() + "-support-line-" + rangeLabel,
        type: "horizontalLine",
        isDrawnByApp: true,
        points: [{ x: point.timestamp, y: point.low }],
        visible: true,
        extraStyles: {
          stroke: "rgba(0, 255, 0, 0.3)",
          strokeWidth: 1,
        },
      };
      swingDrawings.push(supportLine);
    };

    if (sortedSwingLows.length >= 2) {
      const lowestSwing = sortedSwingLows[0]!;

      // Find next lowest swing to the right
      const nextLowestSwing = sortedSwingLows
        .slice(1)
        .filter((swing) => swing.index > lowestSwing.index)
        .sort((a, b) => a.price - b.price)[0];

      // Find next lowest swing to the left
      const leftLowestSwing = sortedSwingLows
        .slice(1)
        .filter((swing) => swing.index < lowestSwing.index)
        .sort((a, b) => a.price - b.price)[0];

      // Draw rectangle if we have a right swing
      if (nextLowestSwing) {
        const supportDrawing: Drawing = {
          id: "drawing-" + Date.now().toString() + "-support-" + rangeLabel,
          type: "rect",
          isDrawnByApp: true,
          points: [
            { x: lowestSwing.date, y: lowestSwing.price },
            { x: nextLowestSwing.date, y: lowestSwing.price },
            { x: nextLowestSwing.date, y: nextLowestSwing.price },
            { x: lowestSwing.date, y: nextLowestSwing.price },
          ],
          visible: true,
          extraStyles: {
            fill: "rgba(0, 255, 0, 0.1)",
            stroke: "rgba(0, 255, 0, 0.3)",
            strokeWidth: 1,
          },
        };
        swingDrawings.push(supportDrawing);
      } else {
        const lowestPoint = data.reduce((min, candle) =>
          candle.low < min.low ? candle : min
        );
        drawSupportLine(lowestPoint);
      }

      // Draw support line for left swing if it exists
      if (leftLowestSwing) {
        drawSupportLine({
          timestamp: leftLowestSwing.date,
          low: leftLowestSwing.price,
        });
      }
    } else {
      // Draw horizontal line at lowest point if no valid swings
      const lowestPoint = data.reduce((min, candle) =>
        candle.low < min.low ? candle : min
      );
      drawSupportLine(lowestPoint);
    }

    // Handle resistance area
    const sortedSwingHighs = [...swingHighs].sort((a, b) => b.price - a.price);

    if (sortedSwingHighs.length >= 2) {
      const highestSwing = sortedSwingHighs[0]!;
      const nextHighestSwing = sortedSwingHighs
        .slice(1)
        .filter((swing) => swing.index > highestSwing.index)
        .sort((a, b) => b.price - a.price)[0];

      if (nextHighestSwing) {
        const resistanceDrawing: Drawing = {
          id: "drawing-" + Date.now().toString() + "-resistance-" + rangeLabel,
          type: "rect",
          isDrawnByApp: true,
          points: [
            { x: highestSwing.date, y: highestSwing.price },
            { x: nextHighestSwing.date, y: highestSwing.price },
            { x: nextHighestSwing.date, y: nextHighestSwing.price },
            { x: highestSwing.date, y: nextHighestSwing.price },
          ],
          visible: true,
          extraStyles: {
            fill: `rgba(255, 0, 0, ${0.1 - parseInt(rangeLabel) * 0.02})`,
            stroke: `rgba(255, 0, 0, ${0.3 - parseInt(rangeLabel) * 0.05})`,
            strokeWidth: 1,
          },
        };
        swingDrawings.push(resistanceDrawing);
      }
    } else {
      // Only draw horizontal line if we don't have enough swing points
      const highestPoint = data.reduce((max, candle) =>
        candle.high > max.high ? candle : max
      );

      const resistanceLine: Drawing = {
        id:
          "drawing-" + Date.now().toString() + "-resistance-line-" + rangeLabel,
        type: "horizontalLine",
        isDrawnByApp: true,
        points: [{ x: highestPoint.timestamp, y: highestPoint.high }],
        visible: true,
        extraStyles: {
          stroke: `rgba(255, 0, 0, ${0.3 - parseInt(rangeLabel) * 0.05})`,
          strokeWidth: 1,
        },
      };
      swingDrawings.push(resistanceLine);
    }
  };

  // Calculate swings for different ranges
  const ranges = [375, 375 * 2, 375 * 3];
  ranges.forEach((range, index) => {
    if (chartData.length >= range) {
      const rangeData = chartData.slice(-range);
      calculateSwingsForRange(rangeData, index.toString());
    }
  });

  return swingDrawings;
};
