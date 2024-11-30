import { useEffect, useRef, useCallback, useState } from "react";
import {
  Drawing,
  DrawingTool,
  Point,
  ChartTheme,
  ChartDimensions,
  ViewState,
} from "../types";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "../../../store/store";
import { setSelectedTool } from "../../../store/slices/globalChartSlice";

interface DrawingCanvasProps {
  drawings: Drawing[];
  dimensions: ChartDimensions;
  theme: ChartTheme;
  selectedTool: DrawingTool | null;
  showDrawings: boolean;
  viewState: ViewState;
  onDrawingComplete: (drawing: Drawing) => void;
  onDrawingUpdate: (drawing: Drawing) => void;
  mousePosition?: { x: number; y: number } | null;
  handleMouseMoveForCrosshair?: (
    e: React.MouseEvent<HTMLCanvasElement>
  ) => void;
}

export const DrawingCanvas = ({
  drawings,
  dimensions,
  theme,
  showDrawings,
  viewState,
  onDrawingComplete,
  onDrawingUpdate,
  mousePosition,
  handleMouseMoveForCrosshair,
}: DrawingCanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dispatch = useDispatch();
  const { selectedTool } = useSelector((state: RootState) => state.globalChart);
  const [drawingInProgress, setDrawingInProgress] = useState<{
    type: DrawingTool;
    points: Point[];
    currentPoint?: Point;
  } | null>(null);
  const [hoveredPoint, setHoveredPoint] = useState<{
    drawingId: string;
    pointIndex: number;
  } | null>(null);
  const [draggingPoint, setDraggingPoint] = useState<{
    drawingId: string;
    pointIndex: number;
    originalPoint: Point;
  } | null>(null);
  const [hoveredLine, setHoveredLine] = useState<string | null>(null);
  const [isDraggingLine, setIsDraggingLine] = useState(false);
  const [dragStartPosition, setDragStartPosition] = useState<Point | null>(
    null
  );
  const POINT_RADIUS = 6;
  const POINT_BORDER_WIDTH = 2;

  // Helper function to convert chart coordinates to canvas coordinates
  const toCanvasCoords = useCallback(
    (point: Point) => {
      const chartWidth =
        dimensions.width - dimensions.padding.left - dimensions.padding.right;
      const mainChartHeight = dimensions.height - (viewState.rsiHeight || 0);

      // Calculate x position based on viewState
      const barWidth = chartWidth / viewState.visibleBars;
      const x =
        dimensions.padding.left + (point.x - viewState.startIndex) * barWidth;

      // Match exactly with getY function calculation
      const adjustedPriceRange =
        ((viewState.maxPrice ?? 0) - (viewState.minPrice ?? 0)) /
        viewState.scaleY;

      const y =
        dimensions.padding.top +
        (((viewState.maxPrice ?? 0) - point.y) / adjustedPriceRange) *
          (mainChartHeight -
            dimensions.padding.top -
            dimensions.padding.bottom);

      return { x, y };
    },
    [dimensions, viewState]
  );

  // Helper function to convert canvas coordinates to chart coordinates
  const toChartCoords = useCallback(
    (x: number, y: number) => {
      const chartWidth =
        dimensions.width - dimensions.padding.left - dimensions.padding.right;
      const mainChartHeight = dimensions.height - (viewState.rsiHeight || 0);

      // Calculate x position in chart coordinates
      const barWidth = chartWidth / viewState.visibleBars;
      const chartX =
        viewState.startIndex + (x - dimensions.padding.left) / barWidth;

      // Match exactly with inverse of getY function calculation
      const adjustedPriceRange =
        ((viewState.maxPrice ?? 0) - (viewState.minPrice ?? 0)) /
        viewState.scaleY;

      const chartY =
        (viewState.maxPrice ?? 0) -
        ((y - dimensions.padding.top) /
          (mainChartHeight -
            dimensions.padding.top -
            dimensions.padding.bottom)) *
          adjustedPriceRange;

      return { x: chartX, y: chartY };
    },
    [dimensions, viewState]
  );

  const drawHorizontalLine = useCallback(
    (ctx: CanvasRenderingContext2D, points: Point[], drawingId?: string) => {
      if (!points[0]) return;

      const canvasPoint = toCanvasCoords(points[0]);

      // Save context state
      ctx.save();

      // Set line style
      ctx.beginPath();
      ctx.strokeStyle = theme.text;
      ctx.lineWidth = hoveredLine === drawingId ? 3 : 1;
      //   ctx.setLineDash([2, 2]);

      // Draw line from left to right
      ctx.moveTo(dimensions.padding.left, canvasPoint.y);
      ctx.lineTo(dimensions.width - dimensions.padding.right, canvasPoint.y);
      ctx.stroke();

      // Draw price label with background for better visibility
      ctx.setLineDash([]); // Reset line dash
      const price = points[0].y.toFixed(2);
      const textWidth = ctx.measureText(price).width;
      const padding = 4;

      // Draw label background
      ctx.fillStyle =
        hoveredLine === drawingId ? theme.accent : theme.background;
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

      // Restore context state
      ctx.restore();
    },
    [dimensions, theme, toCanvasCoords, hoveredLine]
  );

  const drawTrendLine = useCallback(
    (
      ctx: CanvasRenderingContext2D,
      points: Point[],
      isHovered: boolean = false,
      drawingId?: string
    ) => {
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
        [startPoint, endPoint].forEach((point, index) => {
          // Draw white fill
          ctx.beginPath();
          ctx.fillStyle = theme.background;
          ctx.arc(point.x, point.y, POINT_RADIUS, 0, Math.PI * 2);
          ctx.fill();

          // Draw border with accent color
          ctx.beginPath();
          ctx.strokeStyle = theme.accent;
          ctx.lineWidth = POINT_BORDER_WIDTH;
          ctx.arc(point.x, point.y, POINT_RADIUS, 0, Math.PI * 2);
          ctx.stroke();
        });
      }

      ctx.restore();
    },
    [dimensions, theme, toCanvasCoords, hoveredLine, hoveredPoint]
  );

  const isPointNearby = useCallback(
    (canvasX: number, canvasY: number, point: Point) => {
      const canvasPoint = toCanvasCoords(point);
      const distance = Math.sqrt(
        Math.pow(canvasX - canvasPoint.x, 2) +
          Math.pow(canvasY - canvasPoint.y, 2)
      );
      return distance <= POINT_RADIUS;
    },
    [toCanvasCoords]
  );

  const isPointNearLine = useCallback(
    (mouseX: number, mouseY: number, point1: Point, point2?: Point) => {
      if (!point2) {
        // For horizontal line
        const p1 = toCanvasCoords(point1);
        return Math.abs(mouseY - p1.y) <= 10; // More generous threshold for horizontal lines
      }

      // Existing trend line logic
      const p1 = toCanvasCoords(point1);
      const p2 = toCanvasCoords(point2);

      // Calculate distance from point to line segment
      const A = mouseX - p1.x;
      const B = mouseY - p1.y;
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

      const dx = mouseX - xx;
      const dy = mouseY - yy;
      const distance = Math.sqrt(dx * dx + dy * dy);

      return distance <= 5; // 5px threshold for line hover
    },
    [toCanvasCoords]
  );

  console.log({ drawingInProgress, isDraggingLine, draggingPoint });

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;
    handleMouseMoveForCrosshair?.(e);

    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const chartCoords = toChartCoords(x, y);

    // When dragging or drawing tool is selected, maintain high z-index
    if (
      draggingPoint ||
      isDraggingLine ||
      drawingInProgress ||
      selectedTool !== "cursor"
    ) {
      if (canvasRef.current) {
        canvasRef.current.style.zIndex = "100";
      }
    }

    if (draggingPoint) {
      // Update point position while dragging
      const updatedDrawing = drawings.find(
        (d) => d.id === draggingPoint.drawingId
      );
      if (updatedDrawing && updatedDrawing.type === "trendline") {
        const newPoints = [...updatedDrawing.points];
        const pointToUpdate = newPoints[draggingPoint.pointIndex];
        if (pointToUpdate) {
          newPoints[draggingPoint.pointIndex] = chartCoords;
          onDrawingUpdate({
            ...updatedDrawing,
            points: newPoints,
          });
        }
      }
    } else if (isDraggingLine && dragStartPosition && hoveredLine) {
      // Handle line dragging
      const drawing = drawings.find((d) => d.id === hoveredLine);
      if (drawing) {
        if (drawing.type === "trendline") {
          const dx = chartCoords.x - dragStartPosition.x;
          const dy = chartCoords.y - dragStartPosition.y;

          const newPoints = drawing.points.map((point) => ({
            x: point.x + dx,
            y: point.y + dy,
          }));

          onDrawingUpdate({
            ...drawing,
            points: newPoints,
          });

          setDragStartPosition(chartCoords);
        } else if (drawing.type === "horizontalLine" && drawing.points[0]) {
          const dy = chartCoords.y - dragStartPosition.y;

          const newPoints = [
            {
              x: drawing.points[0].x,
              y: drawing.points[0].y + dy,
            },
          ];

          onDrawingUpdate({
            ...drawing,
            points: newPoints,
          });

          setDragStartPosition(chartCoords);
        }
      }
    } else if (drawingInProgress) {
      if (drawingInProgress.type === "trendline") {
        setDrawingInProgress({
          ...drawingInProgress,
          currentPoint: chartCoords,
        });
      }
    } else {
      // Check for point or line hovering
      let foundPoint = false;
      let foundLine = false;

      for (const drawing of drawings) {
        if (drawing.type === "trendline" && drawing.points.length === 2) {
          // Check points first
          for (let i = 0; i < drawing.points.length; i++) {
            const point = drawing.points[i];
            if (point && isPointNearby(x, y, point)) {
              setHoveredPoint({ drawingId: drawing.id, pointIndex: i });
              setHoveredLine(null);
              foundPoint = true;
              break;
            }
          }

          // If no point is hovered, check the line
          if (
            !foundPoint &&
            drawing.points[0] &&
            drawing.points[1] &&
            isPointNearLine(x, y, drawing.points[0], drawing.points[1])
          ) {
            setHoveredLine(drawing.id);
            setHoveredPoint(null);
            foundLine = true;
            break;
          }
        } else if (drawing.type === "horizontalLine" && drawing.points[0]) {
          // Check if mouse is near the horizontal line
          if (isPointNearLine(x, y, drawing.points[0])) {
            setHoveredLine(drawing.id);
            setHoveredPoint(null);
            foundLine = true;
            break;
          }
        }
      }
      //   console.log("foundPoint", foundPoint, foundLine);
      // Update z-index based on interaction state
      if (canvasRef.current) {
        canvasRef.current.style.zIndex =
          foundPoint || foundLine || selectedTool !== "cursor" ? "100" : "1";
      }

      if (!foundPoint && !foundLine) {
        setHoveredPoint(null);
        setHoveredLine(null);
      }
    }
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const chartCoords = toChartCoords(x, y);

    if (hoveredPoint) {
      // Handle point dragging
      const drawing = drawings.find((d) => d.id === hoveredPoint.drawingId);
      if (drawing && drawing.points[hoveredPoint.pointIndex]) {
        setDraggingPoint({
          drawingId: hoveredPoint.drawingId,
          pointIndex: hoveredPoint.pointIndex,
          originalPoint: drawing.points[hoveredPoint.pointIndex]!,
        });
        return;
      }
    } else if (hoveredLine) {
      // Handle line dragging
      setIsDraggingLine(true);
      setDragStartPosition(chartCoords);
      if (canvasRef.current) {
        canvasRef.current.style.cursor = "grabbing";
      }
      return;
    }

    // Handle drawing creation
    if (selectedTool === "trendline") {
      if (!drawingInProgress) {
        setDrawingInProgress({
          type: "trendline",
          points: [chartCoords],
          currentPoint: chartCoords,
        });
      } else if (drawingInProgress.points[0]) {
        const newDrawing: Drawing = {
          id: Date.now().toString(),
          type: "trendline",
          points: [drawingInProgress.points[0], chartCoords],
          visible: true,
        };
        onDrawingComplete(newDrawing);
        setDrawingInProgress(null);
        dispatch(setSelectedTool("cursor"));
      }
    } else if (selectedTool === "horizontalLine") {
      // For horizontal line, we complete the drawing immediately with a single click
      const newDrawing: Drawing = {
        id: Date.now().toString(),
        type: "horizontalLine",
        points: [chartCoords],
        visible: true,
      };
      onDrawingComplete(newDrawing);
      dispatch(setSelectedTool("cursor"));
    }
  };

  const handleMouseUp = () => {
    setDraggingPoint(null);
    setIsDraggingLine(false);
    setDragStartPosition(null);
  };

  useEffect(() => {
    if (!canvasRef.current) return;

    const ctx = canvasRef.current.getContext("2d");
    if (!ctx) return;

    // Set canvas size with device pixel ratio
    const dpr = window.devicePixelRatio || 1;
    canvasRef.current.width = dimensions.width * dpr;
    canvasRef.current.height = dimensions.height * dpr;

    // Clear canvas
    ctx.clearRect(0, 0, dimensions.width * dpr, dimensions.height * dpr);

    // Scale context
    ctx.scale(dpr, dpr);

    if (showDrawings) {
      // Draw all completed drawings
      drawings.forEach((drawing) => {
        if (!drawing.visible) return;

        if (drawing.type === "horizontalLine" && drawing.points[0]) {
          drawHorizontalLine(ctx, drawing.points, drawing.id);
        } else if (
          drawing.type === "trendline" &&
          drawing.points.length === 2
        ) {
          drawTrendLine(ctx, drawing.points, false, drawing.id);
        }
      });

      // Draw drawing in progress
      if (drawingInProgress?.currentPoint) {
        if (drawingInProgress.type === "trendline") {
          drawTrendLine(
            ctx,
            [drawingInProgress.points[0], drawingInProgress.currentPoint],
            true
          );
        } else if (drawingInProgress.type === "horizontalLine") {
          drawHorizontalLine(ctx, [drawingInProgress.currentPoint]);
        }
      }
    }
  }, [
    drawings,
    dimensions,
    showDrawings,
    drawHorizontalLine,
    drawTrendLine,
    viewState,
    drawingInProgress,
    hoveredLine,
    hoveredPoint,
  ]);

  useEffect(() => {
    console.log("useEffect last", mousePosition);

    if (!mousePosition || !canvasRef.current) return;

    let foundInteraction = false;
    const { x, y } = mousePosition;

    // Keep high z-index during active interactions or when drawing tool is selected
    if (
      draggingPoint ||
      isDraggingLine ||
      drawingInProgress ||
      selectedTool !== "cursor"
    ) {
      canvasRef.current.style.zIndex = "100";
      return;
    }

    // Check for drawings under mouse
    for (const drawing of drawings) {
      if (drawing.type === "trendline" && drawing.points.length === 2) {
        // Check points
        for (let i = 0; i < drawing.points.length; i++) {
          const point = drawing.points[i];
          if (point && isPointNearby(x, y, point)) {
            foundInteraction = true;
            break;
          }
        }

        // Check line
        if (
          !foundInteraction &&
          drawing.points[0] &&
          drawing.points[1] &&
          isPointNearLine(x, y, drawing.points[0], drawing.points[1])
        ) {
          foundInteraction = true;
        }
      } else if (drawing.type === "horizontalLine" && drawing.points[0]) {
        // Check horizontal line
        if (isPointNearLine(x, y, drawing.points[0])) {
          foundInteraction = true;
          break;
        }
      }
    }

    // Update z-index only if not in an active interaction state
    canvasRef.current.style.zIndex =
      foundInteraction || selectedTool !== "cursor" ? "100" : "1";
  }, [
    mousePosition,
    drawings,
    isPointNearby,
    isPointNearLine,
    draggingPoint,
    isDraggingLine,
    drawingInProgress,
    selectedTool,
  ]);

  return (
    <canvas
      ref={canvasRef}
      width={dimensions.width}
      height={dimensions.height}
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: `calc(100% - ${30}px)`,
        pointerEvents: "auto",
        cursor: hoveredPoint
          ? "move"
          : hoveredLine
            ? isDraggingLine
              ? "grabbing"
              : "grab"
            : selectedTool === "trendline" || selectedTool === "horizontalLine"
              ? "crosshair"
              : "default",
        zIndex: 1,
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    />
  );
};
