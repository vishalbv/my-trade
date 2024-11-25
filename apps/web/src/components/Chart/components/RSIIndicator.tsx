import { useEffect, useRef } from "react";
import { OHLCData, ChartDimensions, ChartTheme } from "../types";

interface RSIIndicatorProps {
  data: OHLCData[];
  dimensions: ChartDimensions;
  theme: ChartTheme;
  period: number;
  height: number;
  startIndex: number;
  visibleBars: number;
}

export const RSIIndicator: React.FC<RSIIndicatorProps> = ({
  data,
  dimensions,
  theme,
  period,
  height,
  startIndex,
  visibleBars,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current || !data.length) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas size with device pixel ratio
    const dpr = window.devicePixelRatio || 1;
    canvas.width = dimensions.width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    // Clear canvas
    ctx.clearRect(0, 0, dimensions.width, height);

    // Calculate RSI values
    const rsiValues = calculateRSI(data, period);

    // Get visible data
    const visibleRSI = rsiValues.slice(startIndex, startIndex + visibleBars);

    // Calculate dimensions with fractional offset for smooth movement
    const chartWidth =
      dimensions.width - dimensions.padding.left - dimensions.padding.right;
    const chartHeight =
      height - dimensions.padding.top - dimensions.padding.bottom;
    const barWidth = chartWidth / visibleBars;

    // Calculate fractional offset for smooth movement
    const fractionalOffset = startIndex - Math.floor(startIndex);

    // Adjust padding to remove extra space
    const effectivePadding = {
      ...dimensions.padding,
      top: 5, // Reduced from default padding
      bottom: 5, // Reduced from default padding
    };

    // Adjust the scale to show only 10-90 range
    const scaleRSI = (value: number) => {
      // Map RSI value from 10-90 range to 0-100% of chart height
      return effectivePadding.top + ((90 - value) / 80) * chartHeight;
    };

    // Draw filled area between 30 and 70 with adjusted padding
    const y30 = scaleRSI(30);
    const y70 = scaleRSI(70);

    // Fill area between 30-70 with semi-transparent purple
    ctx.fillStyle = "rgba(155, 89, 182, 0.1)";
    ctx.beginPath();
    ctx.rect(dimensions.padding.left, y70, chartWidth, y30 - y70);
    ctx.fill();

    // Update grid lines to show 10-90 range
    const gridLevels = [10, 30, 50, 70, 90];
    gridLevels.forEach((level) => {
      const y = scaleRSI(level);

      // Draw grid line
      ctx.beginPath();
      ctx.strokeStyle = theme.grid;
      ctx.lineWidth = 0.5;

      // Make 30 and 70 lines more prominent
      if (level === 30 || level === 70) {
        ctx.strokeStyle = "rgba(155, 89, 182, 0.5)";
        ctx.lineWidth = 1;
      }

      ctx.moveTo(dimensions.padding.left, y);
      ctx.lineTo(dimensions.width - dimensions.padding.right, y);
      ctx.stroke();

      // Draw label with smaller font and closer to the line
      ctx.fillStyle = theme.text;
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      ctx.font = "10px sans-serif";
      ctx.fillText(
        level.toString(),
        dimensions.width - dimensions.padding.right + 2,
        y
      );
    });

    // Update RSI line drawing to use fractional offset
    let lastValidX: number | null = null;
    let lastValidY: number | null = null;

    visibleRSI.forEach((rsi, i) => {
      if (isNaN(rsi)) return;

      // Apply fractional offset to x position for smooth movement
      const x =
        dimensions.padding.left +
        (i - fractionalOffset) * barWidth +
        barWidth / 2;
      const y = scaleRSI(rsi);

      if (lastValidX === null) {
        ctx.beginPath();
        ctx.moveTo(x, y);
      } else {
        // Set line color based on RSI value and direction
        if (rsi > 70) {
          ctx.strokeStyle = theme.downColor; // Overbought - red
        } else if (rsi < 30) {
          ctx.strokeStyle = theme.upColor; // Oversold - green
        } else {
          ctx.strokeStyle = "#9B59B6"; // Normal range - purple
        }

        ctx.beginPath();
        ctx.lineWidth = 1.5;
        ctx.moveTo(lastValidX, lastValidY!);
        ctx.lineTo(x, y);
        ctx.stroke();
      }

      lastValidX = x;
      lastValidY = y;
    });

    // Update RSI value label position
    if (visibleRSI.length > 0) {
      const lastValidRSI = [...visibleRSI].reverse().find((rsi) => !isNaN(rsi));

      if (lastValidRSI !== undefined) {
        // Set color based on RSI value
        if (lastValidRSI > 70) {
          ctx.fillStyle = theme.downColor;
        } else if (lastValidRSI < 30) {
          ctx.fillStyle = theme.upColor;
        } else {
          ctx.fillStyle = "#9B59B6";
        }

        ctx.textAlign = "left";
        ctx.textBaseline = "top";
        ctx.font = "10px sans-serif";
        ctx.fillText(
          `RSI ${period} ${lastValidRSI.toFixed(2)}`,
          dimensions.padding.left + 2,
          effectivePadding.top + 2
        );
      }
    }
  }, [data, dimensions, theme, period, height, startIndex, visibleBars]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        width: "100%",
        height: "100%",
      }}
    />
  );
};

// Helper function to calculate RSI
function calculateRSI(data: OHLCData[], period: number): number[] {
  const rsi: number[] = [];
  let gains: number[] = [];
  let losses: number[] = [];

  // Filter out dummy candles first
  const realData = data.filter((candle) => candle.display !== false);

  // Calculate price changes only for real candles
  for (let i = 1; i < realData.length; i++) {
    const change = realData[i].close - realData[i - 1].close;
    gains.push(Math.max(0, change));
    losses.push(Math.max(0, -change));
  }

  // Calculate initial averages
  let avgGain =
    gains.slice(0, period).reduce((sum, gain) => sum + gain, 0) / period;
  let avgLoss =
    losses.slice(0, period).reduce((sum, loss) => sum + loss, 0) / period;

  // Calculate initial RSI
  rsi.push(100 - 100 / (1 + avgGain / avgLoss));

  // Calculate subsequent RSI values
  for (let i = period + 1; i < realData.length; i++) {
    avgGain = (avgGain * (period - 1) + gains[i - 1]) / period;
    avgLoss = (avgLoss * (period - 1) + losses[i - 1]) / period;
    rsi.push(100 - 100 / (1 + avgGain / avgLoss));
  }

  // Fill initial values with the first calculated RSI
  const firstRSI = rsi[0];
  for (let i = 0; i < period; i++) {
    rsi.unshift(firstRSI);
  }

  // Create final RSI array matching the original data length
  const finalRSI: number[] = [];
  let rsiIndex = 0;

  // Map RSI values back to original data positions, setting undefined for dummy candles
  data.forEach((candle) => {
    if (candle.display === false) {
      finalRSI.push(NaN); // Use NaN for dummy candles
    } else {
      finalRSI.push(rsi[rsiIndex++] || NaN);
    }
  });

  return finalRSI;
}
