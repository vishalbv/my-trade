import { Point, Drawing } from "../types";
import { drawHorizontalLine } from "../drawings/HorizontalLineDrawing";
import { drawTrendLine } from "../drawings/TrendLineDrawing";
import { drawFibonacci } from "../drawings/FibonacciDrawing";
import { drawPosition } from "../drawings/PositionDrawing";
import { drawRectangle } from "../drawings/RectangleDrawing";

export const checkDrawingInteraction = (
  x: number,
  y: number,
  drawings: Drawing[],
  isPointNearby: (x: number, y: number, point: Point) => boolean,
  isPointNearLine: (
    x: number,
    y: number,
    point1: Point,
    point2?: Point
  ) => boolean,
  toCanvasCoords: (point: Point) => { x: number; y: number },
  dimensions: { width: number; padding: { right: number } }
) => {
  let foundPoint = false;
  let foundLine = false;
  let hoveredPoint = null;
  let hoveredLine = null;

  for (const drawing of drawings) {
    if (drawing.type === "fibonacci" && drawing.points.length === 2) {
      const [point1, point2] = drawing.points as [Point, Point];

      // First check points
      for (let i = 0; i < drawing.points.length; i++) {
        const point = drawing.points[i];
        if (point && isPointNearby(x, y, point)) {
          hoveredPoint = { drawingId: drawing.id, pointIndex: i };
          hoveredLine = null;
          foundPoint = true;
          break;
        }
      }

      // If no point is hovered, check the lines
      if (!foundPoint) {
        const priceRange = point1.y - point2.y;
        const levels = [1, 0.5, 0.618, 0, 1.618];
        const canvasPoint1 = toCanvasCoords(point1);

        for (const level of levels) {
          const levelPrice = point2.y + priceRange * level;
          const canvasY = toCanvasCoords({ x: point1.x, y: levelPrice }).y;

          // Check if mouse is near the horizontal line
          if (
            x >= canvasPoint1.x &&
            x <= dimensions.width - dimensions.padding.right &&
            Math.abs(y - canvasY) <= 5
          ) {
            hoveredLine = drawing.id;
            hoveredPoint = null;
            foundLine = true;
            break;
          }
        }
      }
    } else if (
      (drawing.type === "trendline" ||
        drawing.type === "rect" ||
        drawing.type === "longPosition" ||
        drawing.type === "shortPosition") &&
      drawing.points.length >= 2
    ) {
      // Check points first
      for (let i = 0; i < drawing.points.length; i++) {
        const point = drawing.points[i];
        if (point && isPointNearby(x, y, point)) {
          hoveredPoint = { drawingId: drawing.id, pointIndex: i };
          hoveredLine = null;
          foundPoint = true;
          break;
        }
      }

      // If no point is hovered, check the area
      if (!foundPoint && drawing.points[0] && drawing.points[1]) {
        if (drawing.type === "rect") {
          const [topLeft, , , bottomLeft] = drawing.points as [
            Point,
            Point,
            Point,
            Point,
          ];
          const canvasTopLeft = toCanvasCoords(topLeft);
          const canvasBottomLeft = toCanvasCoords(bottomLeft);
          const chartRightEdge = dimensions.width - dimensions.padding.right;

          // Check if mouse is within rectangle including extended area
          if (
            x >= canvasTopLeft.x &&
            x <= chartRightEdge && // Use chart right edge instead of right point
            y >= Math.min(canvasTopLeft.y, canvasBottomLeft.y) &&
            y <= Math.max(canvasTopLeft.y, canvasBottomLeft.y)
          ) {
            hoveredLine = drawing.id;
            hoveredPoint = null;
            foundLine = true;
            break;
          }
        } else if (
          drawing.type === "longPosition" ||
          drawing.type === "shortPosition"
        ) {
          const [entry, stop, target, right] = drawing.points as [
            Point,
            Point,
            Point,
            Point,
          ];
          const canvasEntry = toCanvasCoords(entry);
          const canvasStop = toCanvasCoords(stop);
          const canvasTarget = toCanvasCoords(target);
          const canvasRight = toCanvasCoords(right);

          if (
            x >= canvasEntry.x &&
            x <= canvasRight.x &&
            // Check target area
            ((y >= Math.min(canvasEntry.y, canvasTarget.y) &&
              y <= Math.max(canvasEntry.y, canvasTarget.y)) ||
              // Check stop area
              (y >= Math.min(canvasEntry.y, canvasStop.y) &&
                y <= Math.max(canvasEntry.y, canvasStop.y)))
          ) {
            hoveredLine = drawing.id;
            hoveredPoint = null;
            foundLine = true;
            break;
          }
        } else {
          // Existing trend line and fibonacci logic
          if (isPointNearLine(x, y, drawing.points[0], drawing.points[1])) {
            hoveredLine = drawing.id;
            hoveredPoint = null;
            foundLine = true;
          }
        }
        if (foundLine) break;
      }
    } else if (drawing.type === "horizontalLine" && drawing.points[0]) {
      if (isPointNearLine(x, y, drawing.points[0])) {
        hoveredLine = drawing.id;
        hoveredPoint = null;
        foundLine = true;
        break;
      }
    }

    if (foundPoint || foundLine) break;
  }

  return {
    foundPoint,
    foundLine,
    hoveredPoint,
    hoveredLine,
  };
};

export const drawingMethods = {
  trendline: (props: any) => {
    const isSelected = props.selectedDrawing?.drawing?.id === props.drawingId;
    const isHovered = props.hoveredLine === props.drawingId;
    const showPoints = !props.draggingPoint && (isSelected || isHovered);
    return drawTrendLine({
      ...props,
      isHovered: isSelected || isHovered,
      showPoints,
    });
  },
  fibonacci: (props: any) => {
    const isSelected = props.selectedDrawing?.drawing?.id === props.drawingId;
    const isHovered = props.hoveredLine === props.drawingId;
    const showPoints = !props.draggingPoint && (isSelected || isHovered);
    return drawFibonacci({
      ...props,
      isHovered: isSelected || isHovered,
      showPoints,
    });
  },
  rect: (props: any) => {
    const isSelected = props.selectedDrawing?.drawing?.id === props.drawingId;
    const isHovered = props.hoveredLine === props.drawingId;
    const showPoints = !props.draggingPoint && (isSelected || isHovered);
    return drawRectangle({
      ...props,
      isHovered: isSelected || isHovered,
      showPoints,
    });
  },
  horizontalLine: (props: any) => {
    const isSelected = props.hoveredLine === props.drawingId;
    return drawHorizontalLine({
      ...props,
      isHovered: isSelected || props.isHovered,
    });
  },
  longPosition: (props: any) => {
    const isSelected = props.hoveredLine === props.drawingId;
    return drawPosition({
      ...props,
      type: "longPosition",
      isHovered: isSelected || props.isHovered,
    });
  },
  shortPosition: (props: any) => {
    const isSelected = props.hoveredLine === props.drawingId;
    return drawPosition({
      ...props,
      type: "shortPosition",
      isHovered: isSelected || props.isHovered,
    });
  },
};

export const isPointNearby = (
  x: number,
  y: number,
  point: Point,
  toCanvasCoords: (point: Point) => { x: number; y: number },
  POINT_RADIUS: number
) => {
  const canvasPoint = toCanvasCoords(point);
  const distance = Math.sqrt(
    Math.pow(x - canvasPoint.x, 2) + Math.pow(y - canvasPoint.y, 2)
  );
  return distance <= POINT_RADIUS;
};

export const isPointNearLine = (
  x: number,
  y: number,
  point1: Point,
  point2: Point | undefined,
  toCanvasCoords: (point: Point) => { x: number; y: number }
) => {
  if (!point2) {
    // For horizontal line
    const p1 = toCanvasCoords(point1);
    return Math.abs(y - p1.y) <= 5; // 5px threshold for horizontal line hover
  }

  const p1 = toCanvasCoords(point1);
  const p2 = toCanvasCoords(point2);

  // Calculate distance from point to line segment
  const A = x - p1.x;
  const B = y - p1.y;
  const C = p2.x - p1.x;
  const D = p2.y - p1.y;

  const dot = A * C + B * D;
  const lenSq = C * C + D * D;
  let param = -1;

  if (lenSq !== 0) param = dot / lenSq;

  let xx, yy;

  if (param < 0) {
    xx = p1.x;
    yy = p1.y;
  } else if (param > 1) {
    xx = p2.x;
    yy = p2.y;
  } else {
    xx = p1.x + param * C;
    yy = p1.y + param * D;
  }

  const dx = x - xx;
  const dy = y - yy;
  const distance = Math.sqrt(dx * dx + dy * dy);

  return distance <= 5; // 5px threshold for line hover
};
