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

    // Calculate dimensions
    const chartWidth =
      dimensions.width - dimensions.padding.left - dimensions.padding.right;
    const chartHeight =
      height - dimensions.padding.top - dimensions.padding.bottom;
    const barWidth = chartWidth / visibleBars;

    // Draw filled area between 30 and 70
    const y30 = dimensions.padding.top + ((100 - 30) / 100) * chartHeight;
    const y70 = dimensions.padding.top + ((100 - 70) / 100) * chartHeight;

    // Fill area between 30-70 with semi-transparent purple
    ctx.fillStyle = "rgba(155, 89, 182, 0.1)"; // Light purple with opacity
    ctx.beginPath();
    ctx.rect(dimensions.padding.left, y70, chartWidth, y30 - y70);
    ctx.fill();

    // Draw grid lines and labels
    const gridLevels = [20, 30, 50, 70, 80];
    gridLevels.forEach((level) => {
      const y = dimensions.padding.top + ((100 - level) / 100) * chartHeight;

      // Draw grid line
      ctx.beginPath();
      ctx.strokeStyle = theme.grid;
      ctx.lineWidth = 0.5;

      // Make 30 and 70 lines more prominent
      if (level === 30 || level === 70) {
        ctx.strokeStyle = "rgba(155, 89, 182, 0.5)"; // Semi-transparent purple
        ctx.lineWidth = 1;
      }

      ctx.moveTo(dimensions.padding.left, y);
      ctx.lineTo(dimensions.width - dimensions.padding.right, y);
      ctx.stroke();

      // Draw label
      ctx.fillStyle = theme.text;
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      ctx.fillText(
        level.toString(),
        dimensions.width - dimensions.padding.right + 5,
        y
      );
    });

    // Draw RSI line with gradient based on value
    visibleRSI.forEach((rsi, i) => {
      const x = dimensions.padding.left + i * barWidth + barWidth / 2;
      const y = dimensions.padding.top + ((100 - rsi) / 100) * chartHeight;

      if (i === 0) {
        ctx.beginPath();
        ctx.moveTo(x, y);
      } else {
        const prevRSI = visibleRSI[i - 1];
        const prevY =
          dimensions.padding.top + ((100 - prevRSI) / 100) * chartHeight;

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
        ctx.moveTo(x - barWidth / 2, prevY);
        ctx.lineTo(x + barWidth / 2, y);
        ctx.stroke();
      }
    });

    // Draw RSI value label at the top left
    if (visibleRSI.length > 0) {
      const currentRSI = visibleRSI[visibleRSI.length - 1];

      // Set color based on RSI value
      if (currentRSI > 70) {
        ctx.fillStyle = theme.downColor;
      } else if (currentRSI < 30) {
        ctx.fillStyle = theme.upColor;
      } else {
        ctx.fillStyle = "#9B59B6";
      }

      ctx.textAlign = "left";
      ctx.textBaseline = "top";
      ctx.font = "12px sans-serif";
      ctx.fillText(
        `RSI ${period} ${currentRSI.toFixed(2)}`,
        dimensions.padding.left + 5,
        dimensions.padding.top + 5
      );
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

  // Calculate price changes
  for (let i = 1; i < data.length; i++) {
    const change = data[i].close - data[i - 1].close;
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
  for (let i = period + 1; i < data.length; i++) {
    avgGain = (avgGain * (period - 1) + gains[i - 1]) / period;
    avgLoss = (avgLoss * (period - 1) + losses[i - 1]) / period;
    rsi.push(100 - 100 / (1 + avgGain / avgLoss));
  }

  // Fill initial values with the first calculated RSI
  const firstRSI = rsi[0];
  for (let i = 0; i < period; i++) {
    rsi.unshift(firstRSI);
  }

  return rsi;
}
