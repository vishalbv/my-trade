import { Point, ChartTheme } from "../types";

interface DrawPositionProps {
  ctx: CanvasRenderingContext2D;
  points: Point[];
  isHovered: boolean;
  drawingId?: string;
  hoveredLine: string | null;
  hoveredPoint: { drawingId: string; pointIndex: number } | null;
  theme: ChartTheme;
  toCanvasCoords: (point: Point) => { x: number; y: number };
  dimensions: { width: number; padding: { left: number; right: number } };
  type: "longPosition" | "shortPosition";
  POINT_RADIUS: number;
  POINT_BORDER_WIDTH: number;
}

export const drawPosition = ({
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
}: DrawPositionProps) => {
  if (points.length < 4) return;

  const [entryPoint, stopPoint, targetPoint, rightPoint] = points as [
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
  const entry = toCanvasCoords(entryPoint);
  const stop = toCanvasCoords(stopPoint);
  const target = toCanvasCoords(targetPoint);
  const right = toCanvasCoords(rightPoint);

  // Draw the main area from entry to target (always green)
  ctx.beginPath();
  ctx.moveTo(entry.x, entry.y);
  ctx.lineTo(right.x, entry.y);
  ctx.lineTo(right.x, target.y);
  ctx.lineTo(entry.x, target.y);
  ctx.closePath();
  ctx.fillStyle = "rgba(0, 153, 129, 0.15)"; // Always green for target area
  ctx.fill();

  // Draw the stop loss area (always red)
  ctx.beginPath();
  ctx.moveTo(entry.x, entry.y);
  ctx.lineTo(right.x, entry.y);
  ctx.lineTo(right.x, stop.y);
  ctx.lineTo(entry.x, stop.y);
  ctx.closePath();
  ctx.fillStyle = "rgba(255, 82, 82, 0.15)"; // Always red for stop area
  ctx.fill();

  // Draw separator line between target and stop areas
  ctx.beginPath();
  ctx.strokeStyle = "#787B8655"; // Grey color with transparency
  ctx.moveTo(entry.x, entry.y);
  ctx.lineTo(right.x, entry.y);
  ctx.stroke();

  // Draw the border lines
  ctx.lineWidth = isHighlighted ? 2 : 1;

  // Draw entry line
  ctx.beginPath();
  ctx.strokeStyle = "grey";
  ctx.moveTo(entry.x, entry.y);
  ctx.lineTo(right.x, entry.y);
  ctx.stroke();

  // Draw target line
  ctx.beginPath();
  ctx.strokeStyle = "#08998133";
  ctx.moveTo(entry.x, target.y);
  ctx.lineTo(right.x, target.y);
  ctx.stroke();

  // Draw stop line
  ctx.beginPath();
  ctx.strokeStyle = "#FF525233";
  ctx.moveTo(entry.x, stop.y);
  ctx.lineTo(right.x, stop.y);
  ctx.stroke();

  // Draw vertical lines
  //   ctx.beginPath();
  //   ctx.strokeStyle = colors.border;
  //   ctx.moveTo(entry.x, Math.min(target.y, entry.y));
  //   ctx.lineTo(entry.x, Math.max(stop.y, entry.y));
  //   ctx.moveTo(right.x, Math.min(target.y, entry.y));
  //   ctx.lineTo(right.x, Math.max(stop.y, entry.y));
  //   ctx.stroke();

  // Draw points when hovered or drawing is highlighted
  if (isHighlighted) {
    [entry, stop, target, right].forEach((point, index) => {
      // Draw point fill
      ctx.beginPath();
      ctx.fillStyle = theme.background;
      ctx.arc(point.x, point.y, POINT_RADIUS, 0, Math.PI * 2);
      ctx.fill();

      // Draw point border
      ctx.beginPath();
      ctx.strokeStyle =
        hoveredPoint?.drawingId === drawingId &&
        hoveredPoint.pointIndex === index
          ? "#2962FF" // Blue when point is hovered
          : "#089981"; // Default color
      ctx.lineWidth = POINT_BORDER_WIDTH;
      ctx.arc(point.x, point.y, POINT_RADIUS, 0, Math.PI * 2);
      ctx.stroke();
    });
  }

  // Only draw labels when hovered
  if (isHighlighted) {
    ctx.font = "10px sans-serif";
    const padding = 4;

    // Target label
    const targetLabel = `Target: ${targetPoint.y.toFixed(2)} (${(((targetPoint.y - entryPoint.y) / entryPoint.y) * 100).toFixed(2)}%)`;
    const targetWidth = ctx.measureText(targetLabel).width;
    ctx.fillStyle = theme.background;
    ctx.fillRect(
      entry.x - padding,
      target.y - 16,
      targetWidth + padding * 2,
      16
    );
    ctx.fillStyle = "#089981";
    ctx.textAlign = "left";
    ctx.fillText(targetLabel, entry.x, target.y - 4);

    // Entry label
    const entryLabel = `Entry: ${entryPoint.y.toFixed(2)}`;
    const entryWidth = ctx.measureText(entryLabel).width;
    ctx.fillStyle = theme.background;
    ctx.fillRect(entry.x - padding, entry.y - 16, entryWidth + padding * 2, 16);
    ctx.fillStyle = "#089981";
    ctx.fillText(entryLabel, entry.x, entry.y - 4);

    // Stop label
    const stopLabel = `Stop: ${stopPoint.y.toFixed(2)} (${(((stopPoint.y - entryPoint.y) / entryPoint.y) * 100).toFixed(2)}%)`;
    const stopWidth = ctx.measureText(stopLabel).width;
    ctx.fillStyle = theme.background;
    ctx.fillRect(entry.x - padding, stop.y - 16, stopWidth + padding * 2, 16);
    ctx.fillStyle = "#FF5252";
    ctx.fillText(stopLabel, entry.x, stop.y - 4);

    // Risk/Reward ratio
    const riskDistance = Math.abs(entryPoint.y - stopPoint.y);
    const rewardDistance = Math.abs(targetPoint.y - entryPoint.y);
    const ratio = (rewardDistance / riskDistance).toFixed(2);
    const riskLabel = `R/R: ${ratio}`;
    const riskWidth = ctx.measureText(riskLabel).width;
    ctx.fillStyle = theme.background;
    ctx.fillRect(
      right.x - riskWidth - padding * 2,
      entry.y + 4,
      riskWidth + padding * 2,
      16
    );
    ctx.fillStyle = "#089981";
    ctx.textAlign = "right";
    ctx.fillText(riskLabel, right.x - padding, entry.y + 16);
  }

  ctx.restore();
};

// Helper to create initial points with 1:1.5 ratio
export const createInitialPositionPoints = (
  clickPoint: Point,
  type: "longPosition" | "shortPosition",
  priceRange: number
): Point[] => {
  const riskRatio = 0.2; // Risk is 20% of visible price range
  const risk = priceRange * riskRatio;
  const reward = risk * 1.5; // 1:1.5 risk/reward ratio
  const width = 50; // Width of the position box

  if (type === "longPosition") {
    return [
      clickPoint, // Entry
      { x: clickPoint.x, y: clickPoint.y - risk }, // Stop (below entry for long)
      { x: clickPoint.x, y: clickPoint.y + reward }, // Target (above entry for long)
      { x: clickPoint.x + width, y: clickPoint.y }, // Right extension point
    ];
  } else {
    return [
      clickPoint, // Entry
      { x: clickPoint.x, y: clickPoint.y + risk }, // Stop (above entry for short)
      { x: clickPoint.x, y: clickPoint.y - reward }, // Target (below entry for short)
      { x: clickPoint.x + width, y: clickPoint.y }, // Right extension point
    ];
  }
};
