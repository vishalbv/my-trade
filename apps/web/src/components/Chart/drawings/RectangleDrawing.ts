import { Point, ChartTheme } from "../types";

interface DrawRectangleProps {
  ctx: CanvasRenderingContext2D;
  points: Point[];
  isHovered: boolean;
  drawingId?: string;
  hoveredLine: string | null;
  hoveredPoint: { drawingId: string; pointIndex: number } | null;
  theme: ChartTheme;
  toCanvasCoords: (point: Point) => { x: number; y: number };
  dimensions: { width: number; padding: { right: number } };
  POINT_RADIUS: number;
  POINT_BORDER_WIDTH: number;
  isSelected: boolean;
  draggingPoint: {
    drawingId: string;
    pointIndex: number;
    originalPoint: Point;
  } | null;
  drawing?: {
    extraStyles?: {
      fill?: string;
      stroke?: string;
      strokeWidth?: number;
    };
  };
}

export const handleRectanglePointDragging = (
  chartCoords: Point,
  points: Point[],
  pointIndex: number
): Point[] => {
  const newPoints = [...points] as [Point, Point, Point, Point];

  switch (pointIndex) {
    case 0: // Top-left
      newPoints[0] = { ...chartCoords };
      newPoints[1] = { ...newPoints[1], y: chartCoords.y };
      newPoints[3] = { ...newPoints[3], x: chartCoords.x };
      break;
    case 1: // Top-right
      newPoints[1] = { ...chartCoords };
      newPoints[0] = { ...newPoints[0], y: chartCoords.y };
      newPoints[2] = { ...newPoints[2], x: chartCoords.x };
      break;
    case 2: // Bottom-right
      newPoints[2] = { ...chartCoords };
      newPoints[3] = { ...newPoints[3], y: chartCoords.y };
      newPoints[1] = { ...newPoints[1], x: chartCoords.x };
      break;
    case 3: // Bottom-left
      newPoints[3] = { ...chartCoords };
      newPoints[2] = { ...newPoints[2], y: chartCoords.y };
      newPoints[0] = { ...newPoints[0], x: chartCoords.x };
      break;
  }

  return newPoints;
};

export const handleRectangleAreaDragging = (
  chartCoords: Point,
  dragStartPosition: Point,
  points: Point[]
): Point[] => {
  const dx = chartCoords.x - dragStartPosition.x;
  const dy = chartCoords.y - dragStartPosition.y;

  return points.map((point) => ({
    x: point.x + dx,
    y: point.y + dy,
  }));
};

export const drawRectangle = ({
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
  drawing,
}: DrawRectangleProps) => {
  if (points.length < 4) return;

  const [topLeft, topRight, bottomRight, bottomLeft] = points as [
    Point,
    Point,
    Point,
    Point,
  ];
  const isHighlighted =
    hoveredLine === drawingId ||
    hoveredPoint?.drawingId === drawingId ||
    isHovered;

  ctx.save();

  // Convert points to canvas coordinates
  const tl = toCanvasCoords(topLeft);
  const tr = toCanvasCoords(topRight);
  const br = toCanvasCoords(bottomRight);
  const bl = toCanvasCoords(bottomLeft);

  // Calculate rectangle dimensions
  const chartRightEdge = dimensions.width - dimensions.padding.right;

  // Get styles from extraStyles or use defaults
  const fillStyle = isHighlighted
    ? "rgba(41, 98, 255, 0.15)"
    : drawing?.extraStyles?.fill || "rgba(41, 98, 255, 0.1)";

  const strokeStyle = isHighlighted
    ? "#2962FF99"
    : drawing?.extraStyles?.stroke || "#2962FF55";

  const strokeWidth = isHighlighted
    ? 1.4
    : drawing?.extraStyles?.strokeWidth || 1;

  // Draw rectangle area
  ctx.beginPath();
  ctx.fillStyle = fillStyle;
  ctx.moveTo(tl.x, tl.y);
  ctx.lineTo(chartRightEdge, tl.y);
  ctx.lineTo(chartRightEdge, bl.y);
  ctx.lineTo(bl.x, bl.y);
  ctx.closePath();
  ctx.fill();

  // Draw rectangle border
  ctx.strokeStyle = strokeStyle;
  ctx.lineWidth = strokeWidth;

  // Draw horizontal lines
  ctx.beginPath();
  ctx.moveTo(tl.x, tl.y);
  ctx.lineTo(chartRightEdge, tl.y);
  ctx.moveTo(bl.x, bl.y);
  ctx.lineTo(chartRightEdge, bl.y);
  ctx.stroke();

  // Draw vertical line (only on the left)
  ctx.beginPath();
  ctx.moveTo(tl.x, tl.y);
  ctx.lineTo(bl.x, bl.y);
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

// Update the initial points creation for rectangle
export const createInitialRectanglePoints = (startPoint: Point): Point[] => {
  return [
    startPoint, // Top-left
    { ...startPoint, x: startPoint.x + 100 }, // Top-right
    { x: startPoint.x + 100, y: startPoint.y + 100 }, // Bottom-right
    { x: startPoint.x, y: startPoint.y + 100 }, // Bottom-left
  ];
};
