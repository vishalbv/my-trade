import { Point, ChartTheme } from "../types";

interface DrawHorizontalLineProps {
  ctx: CanvasRenderingContext2D;
  points: Point[];
  drawingId?: string;
  hoveredLine: string | null;
  theme: ChartTheme;
  toCanvasCoords: (point: Point) => { x: number; y: number };
  dimensions: { width: number; padding: { left: number; right: number } };
}

export const drawHorizontalLine = ({
  ctx,
  points,
  drawingId,
  hoveredLine,
  theme,
  toCanvasCoords,
  dimensions,
  isHovered,
}: DrawHorizontalLineProps) => {
  if (!points[0]) return;

  const canvasPoint = toCanvasCoords(points[0]);

  ctx.save();

  // Set line style
  ctx.beginPath();
  ctx.strokeStyle = theme.text;
  ctx.lineWidth = hoveredLine === drawingId || isHovered ? 2 : 1;

  // Draw line from left to right
  ctx.moveTo(dimensions.padding.left, canvasPoint.y);
  ctx.lineTo(dimensions.width - dimensions.padding.right, canvasPoint.y);
  ctx.stroke();

  // Draw price label with background
  const price = points[0]?.y?.toFixed(2);
  const textWidth = ctx.measureText(price).width;
  const padding = 4;

  // Draw label background
  ctx.fillStyle = hoveredLine === drawingId ? theme.accent : theme.background;
  ctx.fillRect(
    dimensions.width - dimensions.padding.right + 40 - textWidth - padding,
    canvasPoint.y - 8,
    textWidth + padding * 2,
    16
  );

  // Draw price text
  ctx.fillStyle = theme.text;
  ctx.textAlign = "right";
  ctx.textBaseline = "middle";
  ctx.font = "10px sans-serif";
  ctx.fillText(
    price,
    dimensions.width - dimensions.padding.right + 40,
    canvasPoint.y
  );

  ctx.restore();
};
