import { Point, ChartTheme } from "../types";

interface DrawFibonacciProps {
  ctx: CanvasRenderingContext2D;
  points: Point[];
  isHovered: boolean;
  drawingId?: string;
  hoveredLine: string | null;
  hoveredPoint: { drawingId: string; pointIndex: number } | null;
  theme: ChartTheme;
  toCanvasCoords: (point: Point) => { x: number; y: number };
  dimensions: { width: number; padding: { left: number; right: number } };
  POINT_RADIUS: number;
  POINT_BORDER_WIDTH: number;
  isSelected: boolean;
  draggingPoint: {
    drawingId: string;
    pointIndex: number;
    originalPoint: Point;
  } | null;
}

export const drawFibonacci = ({
  ctx,
  points,
  isHovered,
  drawingId,
  hoveredLine,
  hoveredPoint,
  theme,
  toCanvasCoords,
  dimensions,
  POINT_RADIUS,
  POINT_BORDER_WIDTH,
  isSelected,
  draggingPoint,
}: DrawFibonacciProps) => {
  if (points.length < 2) return;

  const [point1, point2] = points as [Point, Point];
  const isHighlighted =
    hoveredLine === drawingId ||
    hoveredPoint?.drawingId === drawingId ||
    isHovered;

  ctx.save();

  const startPoint = toCanvasCoords(point1);
  const endPoint = toCanvasCoords(point2);

  // Calculate Fibonacci levels with specific colors
  const levels = [
    { level: 1, color: "#787B86" }, // Grey
    { level: 0.5, color: "#089981" }, // Green
    { level: 0.618, color: "#FF5252" }, // Red
    { level: 0, color: "#787B86" }, // Grey
    { level: 1.618, color: "rgba(255, 82, 82, 0.5)" }, // Red with 0.5 opacity
  ];

  const priceRange = point1.y - point2.y;
  const chartRightEdge = dimensions.width - dimensions.padding.right;

  // Draw Fibonacci levels
  levels.forEach(({ level, color }) => {
    const levelPrice = point2.y + priceRange * level;
    const levelY = toCanvasCoords({ x: point1.x, y: levelPrice }).y;

    // Draw level line
    ctx.beginPath();
    ctx.strokeStyle = color; // Keep original color
    ctx.lineWidth = isHighlighted ? 2 : 1; // Only change line width on hover
    ctx.moveTo(startPoint.x, levelY);
    ctx.lineTo(chartRightEdge, levelY);
    ctx.stroke();

    // Draw level label with background
    const label = `${Math.abs(level).toFixed(3).replace(/\.0+$/, "")}`;
    const textWidth = ctx.measureText(label).width;
    const padding = 4;
    const labelOffset = 5;

    // Draw label background
    ctx.fillStyle = theme.background;
    ctx.fillRect(
      startPoint.x - padding,
      levelY - labelOffset - 10,
      textWidth + padding * 2,
      12
    );

    // Draw level label
    ctx.fillStyle = color; // Keep original color for labels
    ctx.font = "10px sans-serif";
    ctx.textAlign = "left";
    ctx.fillText(label, startPoint.x, levelY - labelOffset);
  });

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

export const handleFibonacciInteraction = (/* parameters */) => {
  // Fibonacci interaction logic
};
