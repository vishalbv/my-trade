import { Point, ChartTheme } from "../types";

interface DrawTrendLineProps {
  ctx: CanvasRenderingContext2D;
  points: Point[];
  isHovered: boolean;
  isSelected: boolean;
  drawingId?: string;
  hoveredLine: string | null;
  hoveredPoint: { drawingId: string; pointIndex: number } | null;
  theme: ChartTheme;
  toCanvasCoords: (point: Point) => { x: number; y: number };
  POINT_RADIUS: number;
  POINT_BORDER_WIDTH: number;
  draggingPoint: {
    drawingId: string;
    pointIndex: number;
    originalPoint: Point;
  } | null;
}

export const drawTrendLine = ({
  ctx,
  points,
  isHovered,
  isSelected,
  drawingId,
  hoveredLine,
  hoveredPoint,
  theme,
  toCanvasCoords,
  POINT_RADIUS,
  POINT_BORDER_WIDTH,
  draggingPoint,
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
  ctx.lineWidth = isHovered ? 2 : 1;
  ctx.moveTo(startPoint.x, startPoint.y);
  ctx.lineTo(endPoint.x, endPoint.y);
  ctx.stroke();

  const shouldShowPoints =
    isSelected || isHovered || hoveredPoint?.drawingId === drawingId;

  if (shouldShowPoints) {
    // Draw points
    points.forEach((point, index) => {
      // Skip drawing the point that's being dragged
      if (
        draggingPoint &&
        draggingPoint.drawingId === drawingId &&
        draggingPoint.pointIndex === index
      ) {
        return;
      }

      const { x, y } = toCanvasCoords(point);
      ctx.beginPath();
      ctx.arc(x, y, POINT_RADIUS, 0, Math.PI * 2);
      ctx.fillStyle = theme.background;
      ctx.fill();
      ctx.strokeStyle =
        isSelected || isHovered || hoveredPoint?.drawingId === drawingId
          ? "#2962FF"
          : theme.text;
      ctx.lineWidth = POINT_BORDER_WIDTH;
      ctx.stroke();
    });
  }

  ctx.restore();
};
