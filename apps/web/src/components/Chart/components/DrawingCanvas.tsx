import { useEffect, useRef, useCallback } from "react";
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
}

export const DrawingCanvas = ({
  drawings,
  dimensions,
  theme,
  showDrawings,
  viewState,
  onDrawingComplete,
}: DrawingCanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dispatch = useDispatch();
  const { selectedTool } = useSelector((state: RootState) => state.globalChart);

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
    (ctx: CanvasRenderingContext2D, points: Point[]) => {
      if (!points[0]) return;

      const canvasPoint = toCanvasCoords(points[0]);

      // Save context state
      ctx.save();

      // Set line style
      ctx.beginPath();
      ctx.strokeStyle = theme.text;
      ctx.lineWidth = 1;
      ctx.setLineDash([2, 2]);

      // Draw line from left to right
      ctx.moveTo(dimensions.padding.left, canvasPoint.y);
      ctx.lineTo(dimensions.width - dimensions.padding.right, canvasPoint.y);
      ctx.stroke();

      // Draw price label
      ctx.setLineDash([]); // Reset line dash
      ctx.fillStyle = theme.text;
      ctx.textAlign = "right";
      ctx.textBaseline = "middle";
      ctx.font = "10px sans-serif";
      ctx.fillText(
        points[0].y.toFixed(2),
        dimensions.width - dimensions.padding.right + 40,
        canvasPoint.y
      );

      // Restore context state
      ctx.restore();
    },
    [dimensions, theme.text, toCanvasCoords]
  );

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!selectedTool || !canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const chartCoords = toChartCoords(x, y);

    if (selectedTool === "horizontalLine") {
      const newDrawing: Drawing = {
        id: Date.now().toString(),
        type: "horizontalLine",
        points: [chartCoords],
        visible: true,
      };
      onDrawingComplete(newDrawing);

      // Reset tool to cursor after drawing
      dispatch(setSelectedTool("cursor"));
    }
  };

  useEffect(() => {
    if (!canvasRef.current || !showDrawings) return;

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

    // Draw all visible drawings
    drawings.forEach((drawing) => {
      if (!drawing.visible) return;

      if (drawing.type === "horizontalLine" && drawing.points[0]) {
        drawHorizontalLine(ctx, drawing.points);
      }
    });
  }, [drawings, dimensions, showDrawings, drawHorizontalLine, viewState]);

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
        pointerEvents:
          selectedTool && selectedTool !== "cursor" ? "auto" : "none",
        cursor:
          selectedTool && selectedTool !== "cursor" ? "crosshair" : "default",
        zIndex: 100,
      }}
      onMouseDown={handleMouseDown}
    />
  );
};
