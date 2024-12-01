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
import {
  checkDrawingInteraction,
  drawingMethods,
  isPointNearby as isPointNearbyUtil,
  isPointNearLine as isPointNearLineUtil,
} from "../utils/drawingUtils";
import { createInitialPositionPoints } from "../drawings/PositionDrawing";
import {
  handleRectanglePointDragging,
  handleRectangleAreaDragging,
  createInitialRectanglePoints,
} from "../drawings/RectangleDrawing";

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
      const mainChartHeight = dimensions.height - (viewState.rsiHeight || 30);

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
      const mainChartHeight = dimensions.height - (viewState.rsiHeight || 30);

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

  console.log({ drawingInProgress, isDraggingLine, draggingPoint });

  const isPointNearby = useCallback(
    (x: number, y: number, point: Point) => {
      return isPointNearbyUtil(x, y, point, toCanvasCoords, POINT_RADIUS);
    },
    [toCanvasCoords, POINT_RADIUS]
  );

  const isPointNearLine = useCallback(
    (x: number, y: number, point1: Point, point2?: Point) => {
      return isPointNearLineUtil(x, y, point1, point2, toCanvasCoords);
    },
    [toCanvasCoords]
  );

  const handleInteraction = (x: number, y: number) => {
    const {
      foundPoint,
      foundLine,
      hoveredPoint: newHoveredPoint,
      hoveredLine: newHoveredLine,
    } = checkDrawingInteraction(
      x,
      y,
      drawings,
      isPointNearby,
      isPointNearLine,
      toCanvasCoords,
      dimensions
    );

    if (canvasRef.current) {
      canvasRef.current.style.zIndex =
        foundPoint || foundLine || selectedTool !== "cursor" ? "100" : "1";
    }

    if (!foundPoint && !foundLine) {
      setHoveredPoint(null);
      setHoveredLine(null);
    } else {
      setHoveredPoint(newHoveredPoint);
      setHoveredLine(newHoveredLine);
    }

    return { foundPoint, foundLine };
  };

  // Add separate handlers for each drawing type
  const handleFibonacciDragging = (
    chartCoords: Point,
    drawing: Drawing,
    pointIndex: number
  ) => {
    const newPoints = [...drawing.points];
    newPoints[pointIndex] = chartCoords;
    onDrawingUpdate({
      ...drawing,
      points: newPoints,
    });
  };

  const handleTrendLineDragging = (
    chartCoords: Point,
    drawing: Drawing,
    pointIndex: number
  ) => {
    const newPoints = [...drawing.points];
    newPoints[pointIndex] = chartCoords;
    onDrawingUpdate({
      ...drawing,
      points: newPoints,
    });
  };

  const handlePositionDragging = (
    chartCoords: Point,
    drawing: Drawing,
    pointIndex: number
  ) => {
    const newPoints = [...drawing.points];
    const rightPointIndex = pointIndex + 3; // Since right points are 3 positions ahead

    if (pointIndex < 3) {
      // If dragging left points
      newPoints[pointIndex] = {
        x: newPoints[pointIndex].x,
        y: chartCoords.y,
      };

      // Update the corresponding right point
      if (newPoints[rightPointIndex]) {
        newPoints[rightPointIndex] = {
          x: newPoints[rightPointIndex].x,
          y: chartCoords.y,
        };
      }
    } else {
      // If dragging right points
      newPoints[pointIndex] = {
        x: chartCoords.x,
        y: newPoints[pointIndex - 3].y, // Keep y-value synced with left point
      };
    }

    onDrawingUpdate({
      ...drawing,
      points: newPoints,
    });
  };

  // Update handlePointDragging to use specific handlers
  const handlePointDragging = (chartCoords: Point) => {
    const updatedDrawing = drawings.find(
      (d) => d.id === draggingPoint?.drawingId
    );
    if (updatedDrawing && draggingPoint) {
      switch (updatedDrawing.type) {
        case "rect":
          const newPoints = handleRectanglePointDragging(
            chartCoords,
            updatedDrawing.points,
            draggingPoint.pointIndex
          );
          onDrawingUpdate({
            ...updatedDrawing,
            points: newPoints,
          });
          break;
        case "fibonacci":
          handleFibonacciDragging(
            chartCoords,
            updatedDrawing,
            draggingPoint.pointIndex
          );
          break;
        case "trendline":
          handleTrendLineDragging(
            chartCoords,
            updatedDrawing,
            draggingPoint.pointIndex
          );
          break;
        case "longPosition":
        case "shortPosition":
          handlePositionDragging(
            chartCoords,
            updatedDrawing,
            draggingPoint.pointIndex
          );
          break;
      }
    }
  };

  // Add separate line dragging handlers
  const handleFibonacciLineDragging = (
    chartCoords: Point,
    drawing: Drawing,
    dragStartPosition: Point
  ) => {
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
  };

  const handleTrendLineLineDragging = (
    chartCoords: Point,
    drawing: Drawing,
    dragStartPosition: Point
  ) => {
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
  };

  const handlePositionLineDragging = (
    chartCoords: Point,
    drawing: Drawing,
    dragStartPosition: Point
  ) => {
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
  };

  // Update handleLineDragging to use specific handlers
  const handleLineDragging = (chartCoords: Point) => {
    const drawing = drawings.find((d) => d.id === hoveredLine);
    if (drawing && dragStartPosition) {
      switch (drawing.type) {
        case "rect":
          const rectPoints = handleRectangleAreaDragging(
            chartCoords,
            dragStartPosition,
            drawing.points
          );
          onDrawingUpdate({
            ...drawing,
            points: rectPoints,
          });
          break;
        case "fibonacci":
          handleFibonacciLineDragging(chartCoords, drawing, dragStartPosition);
          break;
        case "trendline":
          handleTrendLineLineDragging(chartCoords, drawing, dragStartPosition);
          break;
        case "longPosition":
        case "shortPosition":
          handlePositionLineDragging(chartCoords, drawing, dragStartPosition);
          break;
        case "horizontalLine":
          if (drawing.points[0]) {
            onDrawingUpdate({
              ...drawing,
              points: [
                {
                  x: drawing.points[0].x,
                  y:
                    drawing.points[0].y + (chartCoords.y - dragStartPosition.y),
                },
              ],
            });
          }
          break;
      }
      setDragStartPosition(chartCoords);
    }
  };

  const handleDrawingInProgress = (chartCoords: Point) => {
    if (
      drawingInProgress?.type === "trendline" ||
      drawingInProgress?.type === "fibonacci" ||
      drawingInProgress?.type === "rect"
    ) {
      if (drawingInProgress.type === "rect" && drawingInProgress.points[0]) {
        // For rectangle, create all 4 points dynamically while dragging
        const points = [
          drawingInProgress.points[0], // Top-left
          { x: chartCoords.x, y: drawingInProgress.points[0].y }, // Top-right
          chartCoords, // Bottom-right
          { x: drawingInProgress.points[0].x, y: chartCoords.y }, // Bottom-left
        ];
        setDrawingInProgress({
          ...drawingInProgress,
          points,
          currentPoint: chartCoords,
        });
      } else {
        setDrawingInProgress({
          ...drawingInProgress,
          currentPoint: chartCoords,
        });
      }
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;
    handleMouseMoveForCrosshair?.(e);

    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const chartCoords = toChartCoords(x, y);

    if (draggingPoint) {
      handlePointDragging(chartCoords);
    } else if (isDraggingLine && dragStartPosition && hoveredLine) {
      handleLineDragging(chartCoords);
    } else if (drawingInProgress) {
      handleDrawingInProgress(chartCoords);
    } else {
      handleInteraction(x, y);
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
      if (
        drawing &&
        (drawing.type === "trendline" ||
          drawing.type === "fibonacci" ||
          drawing.type === "rect" ||
          drawing.type === "longPosition" ||
          drawing.type === "shortPosition") &&
        drawing.points[hoveredPoint.pointIndex]
      ) {
        setDraggingPoint({
          drawingId: hoveredPoint.drawingId,
          pointIndex: hoveredPoint.pointIndex,
          originalPoint: drawing.points[hoveredPoint.pointIndex]!,
        });
        if (canvasRef.current) {
          canvasRef.current.style.cursor = "move";
        }
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
    if (
      selectedTool === "trendline" ||
      selectedTool === "fibonacci" ||
      selectedTool === "rect"
    ) {
      if (!drawingInProgress) {
        setDrawingInProgress({
          type: selectedTool,
          points: [chartCoords],
          currentPoint: chartCoords,
        });
      } else if (drawingInProgress.points[0]) {
        const newDrawing: Drawing = {
          id: Date.now().toString(),
          type: selectedTool,
          points: createDrawingPoints(
            selectedTool,
            drawingInProgress.points[0],
            chartCoords
          ),
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
    } else if (
      selectedTool === "longPosition" ||
      selectedTool === "shortPosition"
    ) {
      const priceRange = viewState.maxPrice! - viewState.minPrice!;
      const initialPoints = createInitialPositionPoints(
        chartCoords,
        selectedTool,
        priceRange
      );
      const newDrawing: Drawing = {
        id: Date.now().toString(),
        type: selectedTool,
        points: initialPoints,
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

        const commonProps = {
          ctx,
          points: drawing.points,
          drawingId: drawing.id,
          hoveredLine,
          hoveredPoint,
          theme,
          toCanvasCoords,
          dimensions,
          POINT_RADIUS,
          POINT_BORDER_WIDTH,
        };

        switch (drawing.type) {
          case "horizontalLine":
            drawingMethods.horizontalLine({
              ...commonProps,
            });
            break;
          case "trendline":
            drawingMethods.trendline({
              ...commonProps,
              isHovered: false,
            });
            break;
          case "fibonacci":
            drawingMethods.fibonacci({
              ...commonProps,
              isHovered: false,
            });
            break;
          case "rect":
            drawingMethods.rect({
              ...commonProps,
              isHovered: hoveredLine === drawing.id,
            });
            break;
          case "longPosition":
          case "shortPosition":
            drawingMethods[drawing.type]({
              ...commonProps,
              isHovered: hoveredLine === drawing.id,
            });
            break;
        }
      });

      // Draw drawing in progress
      if (drawingInProgress?.currentPoint && drawingInProgress.points[0]) {
        const commonProps = {
          ctx,
          points: [drawingInProgress.points[0], drawingInProgress.currentPoint],
          hoveredLine,
          hoveredPoint,
          theme,
          toCanvasCoords,
          dimensions,
          POINT_RADIUS,
          POINT_BORDER_WIDTH,
        };

        switch (drawingInProgress.type) {
          case "trendline":
            drawingMethods.trendline({
              ...commonProps,
              isHovered: true,
            });
            break;
          case "fibonacci":
            drawingMethods.fibonacci({
              ...commonProps,
              isHovered: true,
            });
            break;
          case "rect":
            if (drawingInProgress.points.length === 4) {
              drawingMethods.rect({
                ...commonProps,
                points: drawingInProgress.points,
                isHovered: true,
              });
            }
            break;
          case "horizontalLine":
            drawingMethods.horizontalLine({
              ...commonProps,
              points: [drawingInProgress.currentPoint],
            });
            break;
        }
      }
    }
  }, [
    drawings,
    dimensions,
    showDrawings,
    viewState,
    drawingInProgress,
    hoveredLine,
    hoveredPoint,
    theme,
    toCanvasCoords,
  ]);

  useEffect(() => {
    console.log("useEffect last", mousePosition);

    if (!mousePosition || !canvasRef.current) return;

    if (
      draggingPoint ||
      isDraggingLine ||
      drawingInProgress ||
      selectedTool !== "cursor"
    ) {
      canvasRef.current.style.zIndex = "100";
      return;
    }

    handleInteraction(mousePosition.x, mousePosition.y);
  }, [
    mousePosition,
    drawings,
    isPointNearby,
    isPointNearLine,
    draggingPoint,
    isDraggingLine,
    drawingInProgress,
    selectedTool,
    toCanvasCoords,
    dimensions,
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
            : selectedTool === "trendline" ||
                selectedTool === "fibonacci" ||
                selectedTool === "horizontalLine" ||
                selectedTool === "longPosition" ||
                selectedTool === "shortPosition"
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

// Add helper function to create points based on drawing type
const createDrawingPoints = (
  type: DrawingTool,
  startPoint: Point,
  endPoint: Point
): Point[] => {
  if (type === "rect") {
    return [
      startPoint, // Top-left
      { x: endPoint.x, y: startPoint.y }, // Top-right
      endPoint, // Bottom-right
      { x: startPoint.x, y: endPoint.y }, // Bottom-left
    ];
  }
  return [startPoint, endPoint]; // For trendline and fibonacci
};
