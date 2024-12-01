import { Point, ChartTheme } from "../types";

interface DrawTrendLineProps {
  ctx: CanvasRenderingContext2D;
  points: Point[];
  isHovered: boolean;
  drawingId?: string;
  hoveredLine: string | null;
  hoveredPoint: { drawingId: string; pointIndex: number } | null;
  theme: ChartTheme;
  toCanvasCoords: (point: Point) => { x: number; y: number };
  POINT_RADIUS: number;
  POINT_BORDER_WIDTH: number;
}

export const drawTrendLine = ({
  ctx,
  points,
  isHovered,
  drawingId,
  hoveredLine,
  hoveredPoint,
  theme,
  toCanvasCoords,
  POINT_RADIUS,
  POINT_BORDER_WIDTH,
}: DrawTrendLineProps) => {
  if (points.length < 2) return;

  const point1 = points[0];
  const point2 = points[1];
  if (!point1 || !point2) return;

  const startPoint = toCanvasCoords(point1);
  const endPoint = toCanvasCoords(point2);

  ctx.save();

  // Draw line with thicker stroke when hovered
  ctx.beginPath();
  ctx.strokeStyle = theme.text;
  ctx.lineWidth =
    hoveredLine === drawingId ||
    hoveredPoint?.drawingId === drawingId ||
    isHovered
      ? 2
      : 1;
  ctx.moveTo(startPoint.x, startPoint.y);
  ctx.lineTo(endPoint.x, endPoint.y);
  ctx.stroke();

  // Draw endpoints if line is hovered or any point is hovered
  if (
    hoveredLine === drawingId ||
    hoveredPoint?.drawingId === drawingId ||
    isHovered
  ) {
    [startPoint, endPoint].forEach((point) => {
      // Draw white fill
      ctx.beginPath();
      ctx.fillStyle = theme.background;
      ctx.arc(point.x, point.y, POINT_RADIUS, 0, Math.PI * 2);
      ctx.fill();

      // Draw border with blue color
      ctx.beginPath();
      ctx.strokeStyle = "#2962FF";
      ctx.lineWidth = POINT_BORDER_WIDTH;
      ctx.arc(point.x, point.y, POINT_RADIUS, 0, Math.PI * 2);
      ctx.stroke();
    });
  }

  ctx.restore();
};
