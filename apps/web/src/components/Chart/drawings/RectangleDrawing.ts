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

  // Draw rectangle area
  ctx.beginPath();
  ctx.fillStyle = isHighlighted
    ? "rgba(41, 98, 255, 0.15)" // More opacity when highlighted
    : "rgba(41, 98, 255, 0.1)";
  ctx.moveTo(tl.x, tl.y);
  ctx.lineTo(chartRightEdge, tl.y);
  ctx.lineTo(chartRightEdge, bl.y);
  ctx.lineTo(bl.x, bl.y);
  ctx.closePath();
  ctx.fill();

  // Draw rectangle border
  ctx.strokeStyle = isHighlighted ? "#2962FF99" : "#2962FF55";
  ctx.lineWidth = isHighlighted ? 1.4 : 1;

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

  // Draw points when hovered or drawing is highlighted
  if (isHighlighted) {
    const corners = [
      { x: tl.x, y: tl.y }, // Top-left
      { x: tr.x, y: tr.y }, // Top-right
      { x: br.x, y: br.y }, // Bottom-right
      { x: bl.x, y: bl.y }, // Bottom-left
    ];

    corners.forEach((point, index) => {
      // Draw point fill
      ctx.beginPath();
      ctx.fillStyle = theme.background;
      ctx.arc(point.x, point.y, POINT_RADIUS, 0, Math.PI * 2);
      ctx.fill();

      // Draw point border
      ctx.beginPath();
      const isPointHovered =
        hoveredPoint !== null &&
        hoveredPoint.drawingId === drawingId &&
        hoveredPoint.pointIndex === index;
      ctx.strokeStyle = "#2962FF";
      ctx.lineWidth = POINT_BORDER_WIDTH;
      ctx.arc(point.x, point.y, POINT_RADIUS, 0, Math.PI * 2);
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
