import { useEffect, useRef } from "react";
import { OHLCData, ChartDimensions, ChartTheme } from "../types";
import { calculateRSI } from "../utils/indicators";

interface RSIIndicatorProps {
  data: OHLCData[];
  dimensions: ChartDimensions;
  theme: ChartTheme;
  period?: number;
  height?: number;
  startIndex: number;
  visibleBars: number;
}

export const RSIIndicator = ({
  data,
  dimensions,
  theme,
  period = 14,
  height = 100,
  startIndex,
  visibleBars,
}: RSIIndicatorProps) => {
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

    // Get visible data range
    const visibleRSI = rsiValues.slice(startIndex, startIndex + visibleBars);

    // Calculate dimensions
    const chartWidth =
      dimensions.width - dimensions.padding.left - dimensions.padding.right;
    const chartHeight = height - 20; // Leave space for labels
    const barWidth = chartWidth / visibleBars;

    // Draw background
    ctx.fillStyle = theme.background;
    ctx.fillRect(0, 0, dimensions.width, height);

    // Draw grid lines and labels
    const levels = [0, 30, 50, 70, 100];
    ctx.strokeStyle = theme.grid;
    ctx.lineWidth = 0.5;
    ctx.fillStyle = theme.text;
    ctx.textAlign = "right";
    ctx.font = "10px sans-serif";

    levels.forEach((level) => {
      const y = chartHeight * (1 - level / 100);

      // Draw grid line
      ctx.beginPath();
      ctx.moveTo(dimensions.padding.left, y);
      ctx.lineTo(dimensions.width - dimensions.padding.right, y);
      ctx.stroke();

      // Draw label
      ctx.fillText(
        level.toString(),
        dimensions.width - dimensions.padding.right + 3,
        y + 4
      );
    });

    // Draw RSI line
    ctx.beginPath();
    ctx.strokeStyle = theme.text; // Using text color for RSI line
    ctx.lineWidth = 1;

    visibleRSI.forEach((rsi: number, i: number) => {
      const x = dimensions.padding.left + i * barWidth;
      const y = chartHeight * (1 - rsi / 100);

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });

    ctx.stroke();

    // Draw overbought/oversold zones with subtle grid lines
    ctx.strokeStyle = theme.grid;
    ctx.setLineDash([2, 2]);

    // Overbought line (70)
    const overboughtY = chartHeight * 0.3; // 70% level
    ctx.beginPath();
    ctx.moveTo(dimensions.padding.left, overboughtY);
    ctx.lineTo(dimensions.width - dimensions.padding.right, overboughtY);
    ctx.stroke();

    // Oversold line (30)
    const oversoldY = chartHeight * 0.7; // 30% level
    ctx.beginPath();
    ctx.moveTo(dimensions.padding.left, oversoldY);
    ctx.lineTo(dimensions.width - dimensions.padding.right, oversoldY);
    ctx.stroke();

    ctx.setLineDash([]); // Reset dash pattern
  }, [data, dimensions, theme, period, height, startIndex, visibleBars]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        width: "100%",
        height: `${height}px`,
      }}
    />
  );
};
