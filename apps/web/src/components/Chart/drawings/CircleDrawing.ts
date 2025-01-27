import { Drawing, Point } from "../types";

interface DrawProps {
  ctx: CanvasRenderingContext2D;
  points: Point[];
  hoveredPoint: { drawingId: string; pointIndex: number } | null;
  theme: {
    selectedDrawingColor: string;
    hoveredDrawingColor: string;
    drawingColor: string;
    backgroundColor: string;
  };
  toCanvasCoords: (point: Point) => { x: number; y: number };
  POINT_RADIUS: number;
  POINT_BORDER_WIDTH: number;
  isHovered: boolean;
  isSelected: boolean;
  dimensions: {
    width: number;
    padding: { left: number; right: number };
  };
  viewState: {
    visibleBars: number;
  };
  drawing?: Drawing;
}

export const drawCircle = ({
  ctx,
  points,
  hoveredPoint,
  theme,
  toCanvasCoords,
  POINT_RADIUS,
  POINT_BORDER_WIDTH,
  isHovered,
  isSelected,
  dimensions,
  viewState,
  drawing,
}: DrawProps) => {
  if (points.length < 2) return;

  const [centerPoint, radiusPoint] = points;
  if (!centerPoint || !radiusPoint) return;

  const center = toCanvasCoords(centerPoint);
  const radiusCoord = toCanvasCoords(radiusPoint);

  // Calculate radius differently for app-drawn circles
  let radius;
  if (drawing?.isDrawnByApp) {
    // For app-drawn patterns, use fixed size based on candle width
    const chartWidth =
      dimensions.width -
      (dimensions.padding.left || 0) -
      (dimensions.padding.right || 0);

    // Safety checks for negative or invalid values
    if (
      chartWidth <= 0 ||
      !viewState.visibleBars ||
      viewState.visibleBars <= 0
    ) {
      console.warn("Invalid dimensions for circle drawing:", {
        chartWidth,
        visibleBars: viewState.visibleBars,
      });
      return;
    }

    const candleWidth = chartWidth / viewState.visibleBars;

    // Ensure we have a positive radius

    radius = Math.min(Math.max(candleWidth * 1.5, 10), 40);
  } else {
    // For user-drawn circles, use the distance between points
    radius = Math.sqrt(
      Math.pow(radiusCoord.x - center.x, 2) +
        Math.pow(radiusCoord.y - center.y, 2)
    );

    // Ensure minimum radius for visibility
    radius = Math.max(radius, 1);
  }

  // Safety check for invalid coordinates or radius
  if (
    isNaN(center.x) ||
    isNaN(center.y) ||
    isNaN(radius) ||
    radius <= 0 ||
    !isFinite(center.x) ||
    !isFinite(center.y) ||
    !isFinite(radius)
  ) {
    console.warn("Invalid circle parameters:", { center, radius });
    return;
  }

  ctx.beginPath();
  ctx.arc(center.x, center.y, radius, 0, 2 * Math.PI);

  // Get styles from extraStyles or use defaults
  const strokeStyle = isSelected
    ? theme.selectedDrawingColor
    : isHovered
      ? theme.hoveredDrawingColor
      : drawing?.extraStyles?.stroke || theme.drawingColor;

  const strokeWidth =
    isSelected || isHovered ? 2 : drawing?.extraStyles?.strokeWidth || 1;

  const fillStyle = drawing?.extraStyles?.fill || "transparent";

  // Apply styles
  ctx.strokeStyle = strokeStyle;
  ctx.lineWidth = strokeWidth;
  ctx.fillStyle = fillStyle;

  // Draw the circle
  if (fillStyle !== "transparent") {
    ctx.fill();
  }
  ctx.stroke();
};
