import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import {
  OHLCData,
  TimeframeConfig,
  ChartDimensions,
  ChartTheme,
  ViewState,
  Indicator,
  Drawing,
  DrawingTool,
} from "./types";
import { themes } from "./constants/themes";
import { useTheme } from "next-themes";
import { RSIIndicator } from "./components/RSIIndicator";
import { ScrollToRightButton } from "./components/ScrollToRightButton";
import { DrawingCanvas } from "./components/DrawingCanvas";
import { RootState } from "../../store/store";
import { useDispatch, useSelector } from "react-redux";
import {
  convertDrawingsToDataIndex,
  convertDrawingToTimestamp,
  round,
} from "./utils/drawingCoordinateUtils";
import { ActionButtons } from "./ActionButtons";
import { BuySellWindow } from "./components/BuySellWindow";
import { setSelectedDrawing } from "../../store/slices/globalChartSlice";

interface CanvasChartProps {
  data: OHLCData[];
  timeframeConfig: TimeframeConfig;
  indicators: Indicator[];
  selectedTool: DrawingTool | null;
  showDrawings: boolean;
  drawings: Drawing[];
  onDrawingComplete: (drawing: Drawing) => void;
  onDrawingUpdate: (drawing: Drawing) => void; // Make this required, not optional
  chartState: { symbol: string; timeframe: string };
}

interface MousePosition {
  x: number;
  y: number;
  price: number;
  timestamp: number;
  visible: boolean;
}

interface XAxisCrosshair {
  x: number;
  timestamp: number;
  visible: boolean;
}

const ANIMATION_DURATION = 300; // ms

// Add this interface for drag mode
interface DragState {
  mode: "pan" | "scaleX" | "scaleY";
  startX: number;
  startY: number;
  startScaleX: number;
  startScaleY: number;
  startIndex: number;
  startOffsetY: number;
}

const BASE_CANDLE_WIDTH = 10;

let prevTimeframeValue: string = "";
const CanvasChart: React.FC<CanvasChartProps> = ({
  data,
  timeframeConfig,
  indicators,
  selectedTool,
  showDrawings,
  drawings,
  onDrawingComplete,
  onDrawingUpdate,
  chartState,
}) => {
  const isRSIEnabled = indicators.some(
    (indicator) => indicator.id === "rsi" && indicator.enabled
  );

  // Update the state declarations
  const [rsiHeight, setRsiHeight] = useState<number>(100);
  const [isDraggingRSI, setIsDraggingRSI] = useState(false);
  const [dragStartY, setDragStartY] = useState<number>(0);
  const [dragStartHeight, setDragStartHeight] = useState<number>(0);
  const dispatch = useDispatch();
  const mainCanvasRef = useRef<HTMLCanvasElement>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { theme } = useTheme();
  const defaultTheme = themes.dark!; // Ensure dark theme exists
  const currentTheme = themes[theme as keyof typeof themes] || defaultTheme;

  const selectedDrawing = useSelector(
    (state: RootState) => state.globalChart.selectedDrawing
  );

  const [dimensions, setDimensions] = useState<ChartDimensions>({
    width: 0,
    height: 0,
    padding: { top: 0, right: 60, bottom: 0, left: 0 },
  });

  const [viewState, setViewState] = useState<ViewState>({
    scaleX: 1,
    scaleY: 1,
    offsetX: 0,
    offsetY: 0,
    startIndex: 0,
    visibleBars: 0,
    theme: defaultTheme,
  });

  const [dragState, setDragState] = useState<DragState | null>(null);

  const [animation, setAnimation] = useState<{
    startTime: number;
    startState: ViewState;
    targetState: ViewState;
  } | null>(null);

  const [mousePosition, setMousePosition] = useState<MousePosition>({
    x: 0,
    y: 0,
    price: 0,
    timestamp: 0,
    visible: false,
  });

  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const [touchState, setTouchState] = useState<{
    startTouches?: Touch[];
    startDistance?: number;
    startScale?: number;
  }>({});

  // Add state for x-axis crosshair near other state declarations
  const [xAxisCrosshair, setXAxisCrosshair] = useState<XAxisCrosshair>({
    x: 0,
    timestamp: 0,
    visible: false,
  });

  // Add xAxisDragState type and state
  interface XAxisDragState {
    startX: number;
    startScaleX: number;
  }

  // Add state near other state declarations
  const [xAxisDragState, setXAxisDragState] = useState<XAxisDragState | null>(
    null
  );
  const [drawingCanvasMousePos, setDrawingCanvasMousePos] = useState<{
    x: number;
    y: number;
  } | null>(null);

  // Add a ref to store the calculated label positions
  const labelPositionsRef = useRef<{ x: number; timestamp: number }[]>([]);

  // Animate view state changes
  const animateViewState = useCallback(
    (targetState: ViewState) => {
      setAnimation({
        startTime: performance.now(),
        startState: { ...viewState },
        targetState,
      });
    },
    [viewState]
  );

  // Animation frame handler
  useEffect(() => {
    if (!animation) return;

    const animate = (currentTime: number) => {
      const elapsed = currentTime - animation.startTime;
      const progress = Math.min(elapsed / ANIMATION_DURATION, 1);

      // Easing function for smooth animation
      const eased = 1 - Math.pow(1 - progress, 3);

      if (progress < 1) {
        setViewState({
          scaleX:
            animation.startState.scaleX +
            (animation.targetState.scaleX - animation.startState.scaleX) *
              eased,
          scaleY:
            animation.startState.scaleY +
            (animation.targetState.scaleY - animation.startState.scaleY) *
              eased,
          offsetX:
            animation.startState.offsetX +
            (animation.targetState.offsetX - animation.startState.offsetX) *
              eased,
          offsetY:
            animation.startState.offsetY +
            (animation.targetState.offsetY - animation.startState.offsetY) *
              eased,
          startIndex: Math.round(
            animation.startState.startIndex +
              (animation.targetState.startIndex -
                animation.startState.startIndex) *
                eased
          ),
          visibleBars: Math.round(
            animation.startState.visibleBars +
              (animation.targetState.visibleBars -
                animation.startState.visibleBars) *
                eased
          ),
          theme: animation.targetState.theme,
        });
        requestAnimationFrame(animate);
      } else {
        setViewState(animation.targetState);
        setAnimation(null);
      }
    };

    requestAnimationFrame(animate);
  }, [animation]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (mainCanvasRef.current) {
        const rect = mainCanvasRef.current.getBoundingClientRect();
        setDimensions((prev: ChartDimensions) => ({
          ...prev,
          width: rect.width,
          height: rect.height,
        }));
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Update the createDummyCandles function
  const holidays = useSelector(
    (state: RootState) => state.states.app?.holidays || []
  );

  // Helper function to check if date is weekend
  const isWeekend = (date: Date): boolean => {
    const day = date.getDay();
    return day === 0 || day === 6; // 0 is Sunday, 6 is Saturday
  };

  const isHoliday = (date: Date): boolean => {
    const formattedDate = date
      .toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
      .replace(/ /g, "-");

    return holidays.includes(formattedDate) || isWeekend(date);
  };

  const createDummyCandles = useCallback(
    (lastCandle: OHLCData | undefined, count: number): OHLCData[] => {
      if (!lastCandle) return [];

      const dummyCandles: OHLCData[] = [];
      let currentDate = new Date(lastCandle.timestamp);

      // Helper function to get next valid trading time
      const getNextTradingTime = (date: Date): Date => {
        const nextDate = new Date(date.getTime());

        // Keep checking next days until we find a valid trading day
        while (true) {
          const hours = nextDate.getHours();
          const minutes = nextDate.getMinutes();
          const totalMinutes = hours * 60 + minutes;

          // If outside trading hours (9:15 AM - 3:30 PM), move to next day at market open
          if (totalMinutes < 9 * 60 + 15 || totalMinutes > 15 * 60 + 29) {
            nextDate.setDate(nextDate.getDate() + 1);
            nextDate.setHours(9, 15, 0, 0);
          }

          // Check if this is a valid trading day
          if (!isHoliday(nextDate)) {
            return nextDate;
          }

          // If it's a holiday/weekend, try the next day
          nextDate.setDate(nextDate.getDate() + 1);
          nextDate.setHours(9, 15, 0, 0);
        }
      };

      for (let i = 1; i <= count; i++) {
        const nextDate = new Date(currentDate.getTime());

        // Add the time interval based on resolution
        switch (timeframeConfig.resolution) {
          case "1":
            nextDate.setMinutes(nextDate.getMinutes() + 1);
            break;
          case "5":
            nextDate.setMinutes(nextDate.getMinutes() + 5);
            break;
          case "15":
            nextDate.setMinutes(nextDate.getMinutes() + 15);
            break;
          case "D":
            nextDate.setDate(nextDate.getDate() + 1);
            nextDate.setHours(9, 15, 0, 0); // Set to market open
            break;
          default:
            nextDate.setMinutes(nextDate.getMinutes() + 1);
        }

        // Ensure we're within trading hours
        const validTradingTime = getNextTradingTime(nextDate);

        // Add the candle with valid timestamp
        dummyCandles.push({
          timestamp: validTradingTime.getTime(),
          open: lastCandle.close,
          high: lastCandle.close,
          low: lastCandle.close,
          close: lastCandle.close,
          volume: 0,
          display: false,
        });

        currentDate = validTradingTime;
      }

      return dummyCandles;
    },
    [timeframeConfig.resolution]
  );

  // Update the combinedData calculation in the useMemo hook
  const combinedData = useMemo(() => {
    if (!data.length) return [];

    // Always create 500 dummy candles regardless of chart width
    const dummyCandles = createDummyCandles(data[data.length - 1], 500);
    return [...data, ...dummyCandles];
  }, [data, createDummyCandles]);

  // Add this at the top of the component with other refs
  const prevTimeframe = useRef(timeframeConfig.resolution);
  const prevSymbol = useRef(chartState.symbol); // Add symbol reference

  // Add this helper function at the top level
  const calculateInitialScaleY = (data: OHLCData[], chartHeight: number) => {
    // Get last 10 candles or all if less than 10
    const lastCandles = data.slice(-10);
    if (!lastCandles.length) return 1;

    // Calculate price range from last 10 candles
    const prices = lastCandles.flatMap((candle) => [candle.high, candle.low]);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const priceRange = maxPrice - minPrice;
    const pricePadding = priceRange * 0.15;

    // Calculate total range with padding
    const totalRange = priceRange + pricePadding * 2;

    // Calculate base scale (inverse relationship with chart height)
    const baseScale = 650 / chartHeight; // 400 is a reference height
    return baseScale * (chartHeight / totalRange) - 4;
  };

  // Add new state for price range
  const [priceRangeData, setPriceRangeData] = useState<{
    min: number;
    max: number;
    padding: number;
    range: number;
  } | null>(null);

  // Add this helper function (outside of component if possible)
  const calculatePriceRangeFromLast10 = (data: OHLCData[]) => {
    const lastCandles = data.slice(-10);
    if (!lastCandles.length) return { min: 0, max: 0, padding: 0, range: 0 };

    const prices = lastCandles.flatMap((candle) => [candle.high, candle.low]);
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const range = max - min;
    const padding = range * 0.15;

    return {
      min,
      max,
      padding,
      range: range + padding * 2,
    };
  };

  useEffect(() => {
    const newPriceRange = calculatePriceRangeFromLast10(data);
    setPriceRangeData(newPriceRange);
  }, [data.slice(-10).length, timeframeConfig.resolution, chartState.symbol]);

  // Add helper function to calculate initial offset
  const calculateInitialOffset = (data: OHLCData[]) => {
    const lastCandles = data.slice(-10);
    if (!lastCandles.length) return 0;

    const prices = lastCandles.flatMap((candle) => [candle.high, candle.low]);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const priceRange = maxPrice - minPrice;
    const padding = priceRange * 0.15;

    // Calculate offset to position candles in the middle-upper part of the chart
    return (maxPrice - minPrice) * 2; // Adjust this multiplier to change vertical position
  };

  // Update the initialization effect
  useEffect(() => {
    if (!dimensions.width || !combinedData.length) return;

    if (
      viewState.visibleBars === 0 ||
      timeframeConfig.resolution !== prevTimeframe.current ||
      chartState.symbol !== prevSymbol.current
    ) {
      const chartWidth =
        dimensions.width - dimensions.padding.left - dimensions.padding.right;
      const initialVisibleBars = Math.floor(chartWidth / 10);
      const visibleDataBars = Math.floor(initialVisibleBars * 0.7);

      const chartHeight =
        dimensions.height -
        dimensions.padding.top -
        dimensions.padding.bottom -
        (isRSIEnabled ? rsiHeight + 34 : 30);

      // Calculate initial scaleY and offsetY
      const initialScaleY = calculateInitialScaleY(data, chartHeight);
      const initialOffsetY = calculateInitialOffset(data);

      // Reset to initial state
      const initialState: ViewState = {
        scaleX: 1,
        scaleY: 0.3,
        offsetX: 0,
        offsetY: initialOffsetY, // Use calculated offset
        startIndex: Math.max(0, data.length - visibleDataBars),
        visibleBars: initialVisibleBars,
        theme: currentTheme,
        minPrice: undefined,
        maxPrice: undefined,
        rsiHeight: isRSIEnabled ? 100 : 0,
      };

      // Reset animation state
      setAnimation(null);

      // Reset drag states
      setDragState(null);
      setIsDragging(false);
      setDragStart({ x: 0, y: 0 });
      setTouchState({});
      setXAxisDragState(null);

      // Reset mouse position states
      setMousePosition({
        x: 0,
        y: 0,
        price: 0,
        timestamp: 0,
        visible: false,
      });

      setXAxisCrosshair({
        x: 0,
        timestamp: 0,
        visible: false,
      });

      // Reset view state
      setViewState(initialState);

      // Update previous references
      prevTimeframe.current = timeframeConfig.resolution;
      prevSymbol.current = chartState.symbol; // Add symbol reference
    }
  }, [
    combinedData.length,
    dimensions.width,
    currentTheme,
    data.length,
    timeframeConfig.resolution,
    chartState.symbol,
    priceRangeData,
    isRSIEnabled,
  ]);

  // Add a new effect to handle automatic scrolling when at the right edge
  useEffect(() => {
    if (!combinedData.length) return;

    const isAtRightEdge =
      viewState.startIndex + viewState.visibleBars >=
      combinedData.length - Math.floor(viewState.visibleBars * 0.1);

    if (isAtRightEdge) {
      // If we're near the right edge, automatically scroll to show new candles
      setViewState((prev) => ({
        ...prev,
        startIndex: Math.max(0, combinedData.length - prev.visibleBars),
      }));
    }
  }, [combinedData.length, viewState.visibleBars]);

  // Add this state to track if we're dragging
  const [isCleanClick, setIsCleanClick] = useState(true);

  // Add this state to track mouse position at start of click/drag
  const [mouseStartPos, setMouseStartPos] = useState<{
    x: number;
    y: number;
  } | null>(null);

  // Add this state to track if we're currently dragging
  const [isDraggingChart, setIsDraggingChart] = useState(false);

  // Modify handleMouseDown
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    //clearing drawing selection
    dispatch(setSelectedDrawing(null));

    setIsCleanClick(true); // Reset clean click state on mouse down

    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Store initial mouse position
    setMouseStartPos({ x: e.clientX, y: e.clientY });

    // Check if clicking on y-axis
    const isOverYAxis = x >= dimensions.width - dimensions.padding.right;

    if (isOverYAxis) {
      setDragState({
        mode: "scaleY",
        startX: e.clientX,
        startY: e.clientY,
        startScaleX: viewState.scaleX,
        startScaleY: viewState.scaleY,
        startIndex: viewState.startIndex,
        startOffsetY: viewState.offsetY,
      });
      e.currentTarget.style.cursor = "ns-resize";
      setIsCleanClick(false);
    }
    // Remove the else if block that sets pan mode immediately
    setIsDraggingChart(true);
  };

  // Update handleMouseMove
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    handleMouseMoveForCrosshair(e);

    if (mouseStartPos) {
      // Calculate movement distance
      const dx = Math.abs(e.clientX - mouseStartPos.x);
      const dy = Math.abs(e.clientY - mouseStartPos.y);
      const hasMoved = dx > 3 || dy > 3; // Add some threshold before considering it a drag

      if (hasMoved && !dragState) {
        // Only start dragging if we've moved more than the threshold
        setDragState({
          mode: "pan",
          startX: mouseStartPos.x,
          startY: mouseStartPos.y,
          startScaleX: viewState.scaleX,
          startScaleY: viewState.scaleY,
          startIndex: viewState.startIndex,
          startOffsetY: viewState.offsetY,
        });
        e.currentTarget.style.cursor = "grabbing";
        setIsCleanClick(false);
      }
    }

    if (dragState) {
      setIsCleanClick(false); // Not a clean click if we're moving while dragging
      switch (dragState.mode) {
        case "scaleY": {
          const dy = dragState.startY - e.clientY;
          const scaleFactor = 1 + dy / 200;
          const newScaleY = Math.max(
            0.01,
            Math.min(5, dragState.startScaleY * scaleFactor)
          );

          if (!priceRangeData) break;
          const { min, max, padding } = priceRangeData;

          // Get the initial mouse position relative to the chart
          const chartHeight =
            dimensions.height - (isRSIEnabled ? rsiHeight + 34 : 30);
          const initialMouseY = dragState.startY - dimensions.padding.top;
          const chartY = initialMouseY / chartHeight; // Normalized position (0-1)

          // Calculate the price at initial mouse position
          const oldMin = min - padding + dragState.startOffsetY;
          const oldMax = max + padding + dragState.startOffsetY;
          const oldRange = (oldMax - oldMin) / dragState.startScaleY;
          const priceAtMouseStart = oldMax - chartY * oldRange;

          // Calculate new range and required offset to maintain initial mouse position
          const newRange = (oldMax - oldMin) / newScaleY;
          const newMax = oldMin + newRange;
          const targetPriceAtMouse = oldMax - chartY * newRange;
          const offsetRequired = priceAtMouseStart - targetPriceAtMouse;

          setViewState((prev) => ({
            ...prev,
            scaleY: newScaleY,
            offsetY: dragState.startOffsetY + offsetRequired,
          }));
          break;
        }
        case "pan": {
          // Calculate horizontal movement in bars
          const dx = e.clientX - dragState.startX;
          const chartWidth =
            dimensions.width -
            dimensions.padding.left -
            dimensions.padding.right;
          const barWidth = chartWidth / viewState.visibleBars;
          const barsToMove = dx / barWidth;

          // Calculate vertical movement in price
          const dy = e.clientY - dragState.startY;
          const chartHeight =
            dimensions.height -
            dimensions.padding.top -
            dimensions.padding.bottom -
            (isRSIEnabled ? rsiHeight + 34 : 30);

          // Use price range for vertical movement
          if (!priceRangeData) break;
          const { min, max, padding } = priceRangeData;
          const totalPriceRange = (max - min + padding * 2) / viewState.scaleY;
          const pricePerPixel = totalPriceRange / chartHeight;
          const priceMove = dy * pricePerPixel;

          // Update view state with new position
          setViewState((prev) => {
            const proposedStartIndex = dragState.startIndex - barsToMove;
            const maxStartIndex = Math.max(
              0,
              combinedData.length - prev.visibleBars
            );
            const newStartIndex = Math.max(
              0,
              Math.min(maxStartIndex, proposedStartIndex)
            );

            return {
              ...prev,
              startIndex: newStartIndex,
              offsetY: dragState.startOffsetY + priceMove,
            };
          });

          // Request a redraw
          if (gridCanvasRef.current) {
            const ctx = gridCanvasRef.current.getContext("2d");
            if (ctx) {
              drawGridLines(ctx);
            }
          }
          break;
        }
      }
    }
  };

  // Update handleMouseUp
  const handleMouseUp = (e: React.MouseEvent<HTMLDivElement>) => {
    if (dragState) {
      setDragState(null);
      e.currentTarget.style.cursor = "crosshair";
    }
    setMouseStartPos(null); // Reset mouse start position
    setIsDraggingChart(false);
  };

  // Update handleMouseLeave
  const handleMouseLeave = (e: React.MouseEvent<HTMLDivElement>) => {
    if (dragState) {
      setDragState(null);
      e.currentTarget.style.cursor = "crosshair";
    }
    setMouseStartPos(null); // Reset mouse start position
    setMousePosition((prev) => ({ ...prev, visible: false }));
    setXAxisCrosshair((prev) => ({ ...prev, visible: false }));

    if (overlayCanvasRef.current) {
      const ctx = overlayCanvasRef.current.getContext("2d");
      if (ctx) {
        ctx.clearRect(0, 0, dimensions.width, dimensions.height);
      }
    }
  };

  // Reset view to default state
  const resetView = () => {
    if (data.length && dimensions.width) {
      const chartWidth =
        dimensions.width - dimensions.padding.left - dimensions.padding.right;
      const initialVisibleBars = Math.floor(chartWidth / (10 * 1));
      const visibleDataBars = Math.floor(initialVisibleBars * 0.7); // Show 70% of visible area

      setViewState((prev) => ({
        ...prev,
        offsetX: 0,
        offsetY: calculateInitialOffset(data),
        startIndex: Math.max(0, data.length - visibleDataBars), // Position to show 70% real data
        visibleBars: initialVisibleBars,
        theme: currentTheme,
        scaleX: 1,
        scaleY: 0.3,

        minPrice: undefined,
        maxPrice: undefined,
        rsiHeight: isRSIEnabled ? 100 : 0,
      }));
    }
  };

  // Enhanced zoom handler with animation
  const handleZoom = useCallback(
    (
      zoomFactor: number,
      centerX?: number,
      centerY?: number,
      axis: "x" | "y" | "both" = "both"
    ) => {
      if (!combinedData.length || !dimensions.width) return;

      const newState = { ...viewState };

      if (axis === "x" || axis === "both") {
        const newScaleX = Math.max(
          0.1,
          Math.min(5, viewState.scaleX * zoomFactor)
        );
        const newVisibleBars = Math.floor(
          (dimensions.width -
            dimensions.padding.left -
            dimensions.padding.right) /
            (10 * newScaleX)
        );

        if (centerX !== undefined) {
          const chartX = centerX - dimensions.padding.left;
          const mouseBarPosition = chartX / (10 * viewState.scaleX);
          const barOffset =
            mouseBarPosition -
            mouseBarPosition * (newScaleX / viewState.scaleX);
          newState.startIndex = Math.max(
            0,
            Math.min(
              combinedData.length - newVisibleBars,
              viewState.startIndex + Math.floor(barOffset)
            )
          );
        } else {
          const centerIndex = viewState.startIndex + viewState.visibleBars / 2;
          newState.startIndex = Math.max(
            0,
            Math.min(
              combinedData.length - newVisibleBars,
              centerIndex - newVisibleBars / 2
            )
          );
        }

        newState.scaleX = newScaleX;
        newState.visibleBars = newVisibleBars;
      }

      if (axis === "y" || axis === "both") {
        const newScaleY = Math.max(
          0.1,
          Math.min(5, viewState.scaleY * zoomFactor)
        );

        if (centerY !== undefined) {
          // Adjust Y offset to maintain mouse position
          const chartHeight =
            dimensions.height -
            dimensions.padding.top -
            dimensions.padding.bottom;
          const mouseYRatio = (centerY - dimensions.padding.top) / chartHeight;
          const oldRange = chartHeight / viewState.scaleY;
          const newRange = chartHeight / newScaleY;
          const rangeDiff = oldRange - newRange;
          newState.offsetY += rangeDiff * mouseYRatio;
        }

        newState.scaleY = newScaleY;
      }

      animateViewState(newState);
    },
    [viewState, dimensions, combinedData.length, currentTheme, animateViewState]
  );

  // Pan handler with animation
  const handlePan = useCallback(
    (bars: number) => {
      setViewState((prev) => {
        const newStartIndex = Math.max(
          0,
          Math.min(
            combinedData.length - prev.visibleBars,
            prev.startIndex + bars
          )
        );
        return {
          ...prev,
          startIndex: newStartIndex,
        };
      });
    },
    [combinedData.length]
  );

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;

      switch (e.key) {
        case "=":
        case "+":
          handleZoom(1.1);
          break;
        case "-":
          handleZoom(0.9);
          break;
        case "ArrowLeft":
          handlePan(e.ctrlKey ? -10 : -1);
          break;
        case "ArrowRight":
          handlePan(e.ctrlKey ? 10 : 1);
          break;
        case "r":
          if (e.ctrlKey) resetView();
          break;
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [handleZoom, handlePan]);

  // Touch support
  const handleTouchStart = (e: React.TouchEvent) => {
    e.preventDefault();

    if (e.touches.length === 2 && e.touches[0] && e.touches[1]) {
      const distance = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      setTouchState({
        startTouches: Array.from(e.touches) as unknown as Touch[],
        startDistance: distance,
        startScale: viewState.scaleX,
      });
    } else if (e.touches.length === 1 && e.touches[0]) {
      setDragState({
        mode: "pan",
        startX: e.touches[0].clientX,
        startY: e.touches[0].clientY,
        startScaleX: viewState.scaleX,
        startScaleY: viewState.scaleY,
        startIndex: viewState.startIndex,
        startOffsetY: viewState.offsetY,
      });
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    e.preventDefault();

    if (
      e.touches.length === 2 &&
      e.touches[0] &&
      e.touches[1] &&
      touchState.startDistance &&
      touchState.startScale
    ) {
      const distance = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const scale = distance / touchState.startDistance;
      handleZoom((scale / viewState.scaleX) * touchState.startScale);
    } else if (e.touches.length === 1 && e.touches[0] && dragState) {
      const dx = e.touches[0].clientX - dragState.startX;
      const barsToMove = Math.floor(dx / (10 * viewState.scaleX));
      handlePan(-barsToMove);
      setDragState({
        ...dragState,
        startX: e.touches[0].clientX,
        startY: e.touches[0].clientY,
      });
    }
  };

  const handleTouchEnd = () => {
    setDragState(null);
    setTouchState({});
  };

  // First, add this effect at the top level of your component to handle wheel events
  useEffect(() => {
    const preventScroll = (e: WheelEvent) => {
      e.preventDefault();
    };

    // Add the event listener to the container
    if (containerRef.current) {
      containerRef.current.addEventListener("wheel", preventScroll, {
        passive: false,
      });
    }

    return () => {
      // Clean up the event listener
      if (containerRef.current) {
        containerRef.current.removeEventListener("wheel", preventScroll);
      }
    };
  }, []);

  // Update the handleWheel function
  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      if (!combinedData.length || !dimensions.width) return;

      const zoomFactor = e.deltaY > 0 ? 0.99 : 1.01;
      const mouseX =
        e.clientX - (containerRef.current?.getBoundingClientRect().left || 0);
      const mouseY =
        e.clientY - (containerRef.current?.getBoundingClientRect().top || 0);

      // Determine if mouse is over axes
      const isOverYAxis = mouseX > dimensions.width - dimensions.padding.right;
      const isOverXAxis =
        mouseY > dimensions.height - dimensions.padding.bottom;

      let zoomAxis: "x" | "y" | "both" = "both";
      if (isOverYAxis) zoomAxis = "y";
      if (isOverXAxis) zoomAxis = "x";

      // Calculate new bar width when zooming X axis
      if (zoomAxis === "x" || zoomAxis === "both") {
        const chartWidth =
          dimensions.width - dimensions.padding.left - dimensions.padding.right;
        const newScaleX = Math.max(
          0.1,
          Math.min(5, viewState.scaleX * zoomFactor)
        );
        const newBarWidth = BASE_CANDLE_WIDTH * newScaleX;
        const newVisibleBars = Math.floor(chartWidth / newBarWidth);

        // Maintain zoom center
        const mouseBarPosition =
          (mouseX - dimensions.padding.left) /
          (BASE_CANDLE_WIDTH * viewState.scaleX);
        const barOffset =
          mouseBarPosition - mouseBarPosition * (newScaleX / viewState.scaleX);

        setViewState((prev) => ({
          ...prev,
          scaleX: newScaleX,
          visibleBars: newVisibleBars,
          startIndex: Math.max(
            0,
            Math.min(
              combinedData.length - newVisibleBars,
              prev.startIndex + Math.floor(barOffset)
            )
          ),
        }));
      }

      // Handle Y axis zoom as before
      if (zoomAxis === "y" || zoomAxis === "both") {
        // ... existing Y axis zoom code
      }
    },
    [handleZoom, dimensions, combinedData.length, viewState.scaleX]
  );

  // Add the missing double click handler
  const handleDoubleClick = () => {
    resetView();
  };

  const calculateBarX = useCallback(
    (index: number, fractionalOffset = 0) => {
      const chartWidth =
        dimensions.width - dimensions.padding.left - dimensions.padding.right;
      const barWidth = chartWidth / viewState.visibleBars;
      return dimensions.padding.left + (index - fractionalOffset) * barWidth;
    },
    [
      dimensions.width,
      dimensions.padding.left,
      dimensions.padding.right,
      viewState.visibleBars,
    ]
  );

  // First, let's add a helper function to calculate chart dimensions
  const getChartDimensions = useCallback(() => {
    const totalHeight = dimensions.height;
    const xAxisHeight = 30;
    const rsiTotalHeight = isRSIEnabled ? rsiHeight + 4 : 0; // 4px for dragger

    // Calculate main chart height by subtracting x-axis and RSI heights
    const mainChartHeight = totalHeight - xAxisHeight - rsiTotalHeight;
    const mainChartTop = dimensions.padding.top;
    const mainChartBottom = mainChartHeight;
    const mainChartArea = mainChartBottom - mainChartTop;

    return {
      mainChartHeight,
      mainChartTop,
      mainChartBottom,
      mainChartArea,
      xAxisHeight,
      rsiTotalHeight,
      totalHeight,
    };
  }, [dimensions.height, dimensions.padding, isRSIEnabled, rsiHeight]);

  // Update handleMouseMoveForCrosshair function
  const handleMouseMoveForCrosshair = useCallback(
    (e: React.MouseEvent) => {
      if (!containerRef.current || !currentTheme || !priceRangeData) return;

      const rect = containerRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      setDrawingCanvasMousePos({ x, y });

      // Check if mouse is within chart bounds
      if (
        x >= dimensions.padding.left &&
        x <= dimensions.width - dimensions.padding.right &&
        y >= dimensions.padding.top &&
        y <= dimensions.height - dimensions.padding.bottom
      ) {
        const chartWidth =
          dimensions.width - dimensions.padding.left - dimensions.padding.right;
        const barWidth = chartWidth / viewState.visibleBars;
        const mouseX = x - dimensions.padding.left;

        // Get the fractional offset of the first visible candle
        const startIndexFraction =
          viewState.startIndex - Math.floor(viewState.startIndex);

        // Adjust exactBarIndex by accounting for the fractional start
        const exactBarIndex = mouseX / barWidth + startIndexFraction;

        // Get the nearest bar index based on which half of the bar we're in
        const barIndex = Math.floor(exactBarIndex);
        const fractionalPart = exactBarIndex - barIndex;

        // If we're past the midpoint of the current bar, move to the next bar
        const adjustedBarIndex =
          fractionalPart >= 0.5 ? barIndex + 1 : barIndex;

        // Calculate the final data index by using the floored start index
        const dataIndex = Math.floor(viewState.startIndex) + adjustedBarIndex;
        const candle = combinedData[dataIndex];

        if (candle) {
          // Use calculateBarX for consistent positioning
          const barCenterX = calculateBarX(
            adjustedBarIndex,
            viewState.startIndex - Math.floor(viewState.startIndex)
          );

          // Calculate price using last 10 candles range
          const mainChartHeight =
            dimensions.height - (isRSIEnabled ? rsiHeight + 34 : 30);
          const chartHeight =
            mainChartHeight -
            dimensions.padding.top -
            dimensions.padding.bottom;

          // Get price range from last 10 candles
          const { min, max, padding } = priceRangeData;
          const adjustedMin = min - padding + viewState.offsetY;
          const adjustedMax = max + padding + viewState.offsetY;
          const adjustedRange = (adjustedMax - adjustedMin) / viewState.scaleY;

          // Calculate price based on mouse position
          const priceRatio = (y - dimensions.padding.top) / chartHeight;
          const price = adjustedMax - priceRatio * adjustedRange;

          setMousePosition({
            x: barCenterX,
            y,
            price,
            timestamp: candle.timestamp,
            visible: true,
          });

          setXAxisCrosshair({
            x: barCenterX,
            timestamp: candle.timestamp,
            visible: true,
          });
        }
      } else {
        setMousePosition((prev) => ({ ...prev, visible: false }));
        setXAxisCrosshair((prev) => ({ ...prev, visible: false }));
      }
    },
    [
      dimensions,
      viewState.startIndex,
      viewState.visibleBars,
      viewState.scaleY,
      viewState.offsetY,
      combinedData,
      priceRangeData,
      calculateBarX,
    ]
  );

  // Add resize observer effect if not already present

  // Update the calculateTimeStep function for better time intervals
  // const calculateTimeStep = (
  //   timeRange: number,
  //   visibleBars: number
  // ): number => {
  //   const msPerDay = 86400000;
  //   const msPerHour = 3600000;
  //   const msPerMinute = 60000;

  //   // More granular time steps like TradingView
  //   if (timeRange > msPerDay * 5) return msPerDay; // Daily
  //   if (timeRange > msPerDay) return msPerHour * 6; // 6 hours
  //   if (timeRange > msPerHour * 12) return msPerHour * 2; // 2 hours
  //   if (timeRange > msPerHour * 4) return msPerHour; // 1 hour
  //   if (timeRange > msPerHour * 2) return msPerMinute * 30; // 30 minutes
  //   if (timeRange > msPerHour) return msPerMinute * 15; // 15 minutes
  //   if (timeRange > msPerMinute * 30) return msPerMinute * 5; // 5 minutes
  //   return msPerMinute; // 1 minute
  // };

  // Update formatTimeLabel function to be more intelligent
  const formatTimeLabel = useCallback((date: Date, prevDate: Date | null) => {
    if (!date.getTime()) return ""; // Don't format invalid dates

    const hours = date.getHours();
    const minutes = date.getMinutes();
    const isMarketOpen = hours === 9 && minutes === 15;

    // Check for year/month/date changes
    const isYearChange =
      prevDate && date.getFullYear() !== prevDate.getFullYear();
    const isMonthChange =
      prevDate && (date.getMonth() !== prevDate.getMonth() || isYearChange);
    const isDateChange =
      prevDate && (date.getDate() !== prevDate.getDate() || isMonthChange);

    // Format based on changes
    if (isYearChange) {
      return date.toLocaleString("default", { year: "numeric" });
    }

    if (isMonthChange) {
      return date.toLocaleString("default", { month: "short", day: "2-digit" });
    }

    if (isDateChange || isMarketOpen) {
      return date.toLocaleString("default", { day: "2-digit" });
    }

    // For regular time labels
    return date.toLocaleTimeString("default", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  }, []);

  // Update the calculateNiceNumber function for better grid spacing
  const calculateNiceNumber = (range: number, maxTicks: number = 6): number => {
    const minTicks = 3;
    const roughStep = range / (maxTicks - 1);
    const magnitude = Math.pow(10, Math.floor(Math.log10(roughStep)));
    const normalizedStep = roughStep / magnitude;

    let niceStep;
    if (normalizedStep < 2) niceStep = 2;
    else if (normalizedStep < 5) niceStep = 5;
    else niceStep = 10;

    niceStep *= magnitude;

    // Ensure we don't have too few or too many grid lines
    const numTicks = Math.round(range / niceStep);
    if (numTicks < minTicks) {
      return calculateNiceNumber(range, maxTicks + 1);
    }
    if (numTicks > maxTicks) {
      return calculateNiceNumber(range, maxTicks - 1);
    }

    return niceStep;
  };

  // Add function to check label overlap
  // const willLabelsOverlap = (
  //   ctx: CanvasRenderingContext2D,
  //   labels: { x: number; text: string }[],
  //   minSpacing: number
  // ): boolean => {
  //   for (let i = 1; i < labels.length; i++) {
  //     const prevLabel = labels[i - 1];
  //     const currentLabel = labels[i];
  //     if (!prevLabel || !currentLabel) continue;
  //     const prevWidth = ctx.measureText(prevLabel.text).width;
  //     const spacing = currentLabel.x - (prevLabel.x + prevWidth);
  //     if (spacing < minSpacing) return true;
  //   }
  //   return false;
  // };

  // Add this before calculateGridPrices
  const getY = useCallback(
    (price: number, chartHeight: number) => {
      if (!priceRangeData) return 0;
      const { min, max, padding } = priceRangeData;
      const adjustedMin = min - padding + viewState.offsetY;
      const adjustedMax = max + padding + viewState.offsetY;
      const adjustedRange = (adjustedMax - adjustedMin) / viewState.scaleY;

      return (
        dimensions.padding.top +
        ((adjustedMax - price) / adjustedRange) *
          (chartHeight - dimensions.padding.top - dimensions.padding.bottom)
      );
    },
    [dimensions, viewState.offsetY, viewState.scaleY, priceRangeData]
  );

  // Update the previousGridLines state type to include a transition ID
  const [previousGridLines, setPreviousGridLines] = useState<{
    prices: number[];
    opacity: number;
    transitionId: number;
  }>({ prices: [], opacity: 1, transitionId: 0 });

  // Modify calculateGridPrices to handle transitions better
  const calculateGridPrices = useCallback(
    (
      chartHeight: number,
      getYFunc: (price: number, height: number) => number
    ): {
      gridPrices: number[];
      priceLabels: { y: number; text: string }[];
      skipFactor: number;
    } => {
      if (!priceRangeData)
        return { gridPrices: [], priceLabels: [], skipFactor: 1 };

      const { min, max, padding } = priceRangeData;
      const adjustedMin = min - padding + viewState.offsetY;
      const adjustedMax = max + padding + viewState.offsetY;
      const visiblePriceRange = (adjustedMax - adjustedMin) / viewState.scaleY;

      // Calculate grid step with 30% smaller spacing
      let gridPriceStep = calculateNiceNumber(visiblePriceRange * 0.7, 6);

      // Extend the range by 5x in both directions
      const extendedRange = visiblePriceRange * 5;
      const extendedMin = adjustedMin - extendedRange;
      const extendedMax = adjustedMax + extendedRange;

      // Calculate all possible grid lines with extended range
      const allGridPrices: number[] = [];
      const firstGridPrice =
        Math.ceil(extendedMin / gridPriceStep) * gridPriceStep;

      for (
        let price = firstGridPrice;
        price <= extendedMax;
        price += gridPriceStep
      ) {
        allGridPrices.push(price);
      }

      // Calculate spacing and skip factor
      const spacing =
        allGridPrices.length >= 2
          ? Math.abs(
              getYFunc(allGridPrices[0]!, chartHeight) -
                getYFunc(allGridPrices[1]!, chartHeight)
            )
          : 30;

      const skipFactor = Math.max(1, Math.ceil(30 / spacing));

      // Filter grid lines based on skip factor
      const gridPrices = allGridPrices.filter(
        (_, index) => index % skipFactor === 0
      );

      // Create labels for visible grid lines
      const priceLabels = gridPrices.map((price) => ({
        y: getYFunc(price, chartHeight),
        text: price.toFixed(2),
      }));

      return { gridPrices, priceLabels, skipFactor };
    },
    [priceRangeData, viewState.offsetY, viewState.scaleY, getY]
  );

  // Update drawYAxisLabels function
  const drawYAxisLabels = useCallback(
    (ctx: CanvasRenderingContext2D) => {
      if (!ctx || !priceRangeData) return;

      // Clear the entire y-axis canvas
      ctx.clearRect(0, 0, dimensions.width, dimensions.height);

      const chartHeight =
        dimensions.height - (isRSIEnabled ? rsiHeight + 34 : 30);
      const { gridPrices } = calculateGridPrices(chartHeight, getY);

      // Draw price labels
      ctx.globalAlpha = 1;
      gridPrices.forEach((price) => {
        const y = getY(price, chartHeight);
        ctx.fillStyle = currentTheme?.text;
        ctx.textAlign = "left";
        ctx.textBaseline = "middle";
        ctx.font = `10px ${currentTheme.fontFamily}`;
        ctx.fillText(
          price.toFixed(2),
          5, // Start from left edge of y-axis canvas
          y
        );
      });
    },
    [
      dimensions,
      priceRangeData,
      isRSIEnabled,
      rsiHeight,
      getY,
      calculateGridPrices,
      currentTheme,
    ]
  );

  // Update the animation effect
  useEffect(() => {
    let animationFrame: number;
    let startTime: number | null = null;

    const updateGrids = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const duration = 300; // Animation duration in ms

      if (elapsed < duration && dragState?.mode === "scaleY") {
        setPreviousGridLines((prev) => ({
          ...prev,
          opacity: Math.max(0, 1 - elapsed / duration),
        }));
        animationFrame = requestAnimationFrame(updateGrids);
      }
    };

    if (dragState?.mode === "scaleY") {
      animationFrame = requestAnimationFrame(updateGrids);
    }

    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, [dragState?.mode]);

  // Update the RSI separator mouse down handler
  const handleRSISeparatorMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDraggingRSI(true);
    setDragStartY(e.clientY);
    setDragStartHeight(rsiHeight);
  };

  // Add this function to calculate clip boundaries
  // const getClipBoundaries = useCallback(() => {
  //   const chartWidth =
  //     dimensions.width - dimensions.padding.left - dimensions.padding.right;
  //   const totalHeight =
  //     dimensions.height - (isRSIEnabled ? rsiHeight + 34 : 30);
  //   const chartHeight =
  //     totalHeight - dimensions.padding.top - dimensions.padding.bottom;

  //   return {
  //     left: chartWidth, // 1x chart width to the left
  //     right: chartWidth, // 1x chart width to the right
  //     top: chartHeight, // 1x chart height to the top
  //     bottom: chartHeight, // 1x chart height to the bottom
  //   };
  // }, [
  //   dimensions.width,
  //   dimensions.height,
  //   dimensions.padding,
  //   isRSIEnabled,
  //   rsiHeight,
  // ]);

  // Update the drawChart function to use calculateBarX
  const drawChart = useCallback(
    (ctx: CanvasRenderingContext2D) => {
      // Clear canvas
      ctx.clearRect(0, 0, dimensions.width, dimensions.height);

      // Calculate chart dimensions
      const chartWidth =
        dimensions.width - dimensions.padding.left - dimensions.padding.right;
      const totalHeight =
        dimensions.height - (isRSIEnabled ? rsiHeight + 34 : 30);
      const chartHeight =
        totalHeight - dimensions.padding.top - dimensions.padding.bottom;

      // Calculate candle dimensions using scaleX
      const barWidth = chartWidth / viewState.visibleBars;
      const candleWidth = barWidth * 0.8; // 80% of bar width

      // Get visible data
      const visibleStartIndex = Math.floor(viewState.startIndex);
      const visibleData = combinedData.slice(
        visibleStartIndex,
        visibleStartIndex + viewState.visibleBars
      );

      if (!visibleData.length) return;

      // Use last 10 candles for price range
      const { min, max, padding } = priceRangeData;
      const adjustedMin = min - padding + viewState.offsetY;
      const adjustedMax = max + padding + viewState.offsetY;

      // Draw horizontal grid lines
      // gridPrices.forEach((price) => {
      //   const y = getY(price, adjustedMinPrice, adjustedMaxPrice, chartHeight);

      //   ctx.beginPath();
      //   ctx.strokeStyle = currentTheme?.grid || defaultTheme.grid;
      //   ctx.lineWidth = 0.5;
      //   ctx.moveTo(dimensions.padding.left, y);
      //   ctx.lineTo(dimensions.width - dimensions.padding.right, y);
      //   ctx.stroke();

      //   // Draw price label
      //   ctx.fillStyle = currentTheme?.text || defaultTheme.text;
      //   ctx.textAlign = "left";
      //   ctx.textBaseline = "middle";
      //   ctx.fillText(
      //     price.toFixed(2),
      //     dimensions.width - dimensions.padding.right + 5,
      //     y
      //   );
      // });

      // Calculate fractional offset for smooth scrolling
      const fractionalOffset =
        viewState.startIndex - Math.floor(viewState.startIndex);

      // Draw candlesticks using calculateBarX
      visibleData.forEach((candle, i) => {
        // Use calculateBarX for x position
        const x = calculateBarX(i, fractionalOffset);
        const candleLeft = x - candleWidth / 2;

        const openY = getY(candle.open, chartHeight);
        const closeY = getY(candle.close, chartHeight);
        const highY = getY(candle.high, chartHeight);
        const lowY = getY(candle.low, chartHeight);

        const opacity = candle.display === false ? 0 : 1;

        ctx.globalAlpha = opacity;
        ctx.fillStyle =
          candle.close >= candle.open
            ? currentTheme?.upColor
            : currentTheme?.downColor;
        ctx.strokeStyle = ctx.fillStyle;

        // Draw wick
        ctx.beginPath();
        ctx.moveTo(x, highY);
        ctx.lineTo(x, lowY);
        ctx.stroke();

        // Draw candle body
        const bodyHeight = Math.max(Math.abs(closeY - openY), 1);
        ctx.fillRect(
          candleLeft,
          Math.min(openY, closeY),
          candleWidth,
          bodyHeight
        );
      });

      // Reset opacity
      ctx.globalAlpha = 1;

      // Draw last price line
      if (data.length > 0) {
        const lastCandle = data[data.length - 1];
        const previousCandle = data[data.length - 2];

        const lineColor =
          previousCandle && lastCandle
            ? lastCandle.close >= previousCandle.close
              ? currentTheme?.upColor
              : currentTheme?.downColor
            : currentTheme?.upColor;
        if (!lastCandle) return;
        const y = getY(lastCandle.close, chartHeight);

        ctx.save();
        ctx.beginPath();
        ctx.setLineDash([2, 2]);
        ctx.strokeStyle = lineColor;
        ctx.lineWidth = 0.4;

        ctx.moveTo(dimensions.padding.left, y);
        ctx.lineTo(dimensions.width - dimensions.padding.right, y);
        ctx.stroke();

        ctx.restore();
      }
    },
    [
      dimensions,
      viewState,
      combinedData,
      priceRangeData,
      isRSIEnabled,
      rsiHeight,
      currentTheme,
      defaultTheme,
      calculateGridPrices,
      getY,
      calculateBarX,
    ]
  );

  // Then use it in handleRSIDrag
  const handleRSIDrag = useCallback(
    (e: MouseEvent) => {
      if (!isDraggingRSI || !containerRef.current) return;

      const containerRect = containerRef.current.getBoundingClientRect();
      const containerHeight = containerRect.height;
      const dy = dragStartY - e.clientY;

      const newHeight = Math.max(
        50,
        Math.min(containerHeight * 0.8, dragStartHeight + dy)
      );

      requestAnimationFrame(() => {
        setRsiHeight(newHeight);
        if (mainCanvasRef.current) {
          const ctx = mainCanvasRef.current.getContext("2d");
          if (ctx) {
            drawChart(ctx);
          }
        }
      });
    },
    [isDraggingRSI, dragStartY, dragStartHeight, drawChart]
  );

  // Add handleRSIDragEnd
  const handleRSIDragEnd = useCallback(() => {
    setIsDraggingRSI(false);
  }, []);

  // Update the RSI drag effect
  useEffect(() => {
    if (isDraggingRSI) {
      window.addEventListener("mousemove", handleRSIDrag);
      window.addEventListener("mouseup", handleRSIDragEnd);
    }
    return () => {
      window.removeEventListener("mousemove", handleRSIDrag);
      window.removeEventListener("mouseup", handleRSIDragEnd);
    };
  }, [isDraggingRSI, handleRSIDrag, handleRSIDragEnd]);

  // Update the main render effect to use the drawChart function
  useEffect(() => {
    if (!mainCanvasRef.current || !data.length) return;
    const ctx = mainCanvasRef.current.getContext("2d");
    if (!ctx) return;

    // Set canvas size with device pixel ratio
    const dpr = window.devicePixelRatio || 1;
    mainCanvasRef.current.width = dimensions.width * dpr;
    mainCanvasRef.current.height = dimensions.height * dpr;
    ctx.scale(dpr, dpr);

    drawChart(ctx);
  }, [drawChart, dimensions, data.length]);

  // Update the RSI container style to use transform for smoother animation
  const rsiContainerStyle: React.CSSProperties = {
    zIndex: 3,
    position: "absolute",
    bottom: 0,
    width: "100%",
    height: `${rsiHeight}px`,
    borderTop: `1px solid ${currentTheme?.grid}`,
    transform: "translate3d(0, 0, 0)", // Enable hardware acceleration
    willChange: "height", // Hint to browser about the changing property
  };

  // Update the RSI section in the return JSX
  {
    isRSIEnabled && (
      <>
        <div
          style={{
            height: "4px",
            backgroundColor: currentTheme?.grid,
            cursor: "ns-resize",
            width: "100%",
            position: "absolute",
            bottom: `${rsiHeight}px`,
            zIndex: 3,
            transform: "translate3d(0, 0, 0)", // Enable hardware acceleration
          }}
          onMouseDown={handleRSISeparatorMouseDown}
        >
          <div
            style={{
              position: "absolute",
              left: "50%",
              top: "50%",
              transform: "translate(-50%, -50%)",
              width: "30px",
              height: "2px",
              backgroundColor: currentTheme?.text,
              opacity: isDraggingRSI ? 0.8 : 0.5, // Increase opacity while dragging
              transition: "opacity 0.2s ease",
            }}
          />
        </div>

        <div style={rsiContainerStyle}>
          <RSIIndicator
            data={combinedData}
            dimensions={{
              ...dimensions,
              height: rsiHeight, // Pass the current height
              padding: {
                ...dimensions.padding,
                bottom: 0,
              },
            }}
            theme={currentTheme}
            period={14}
            height={rsiHeight}
            startIndex={viewState.startIndex}
            visibleBars={viewState.visibleBars}
          />
        </div>
      </>
    );
  }

  const getIntervalFrom2Candles = (
    candle1?: OHLCData,
    candle2?: OHLCData
  ): string => {
    if (!candle1 || !candle2) return "unknown";

    const timestamp1 = new Date(candle1.timestamp);
    const timestamp2 = new Date(candle2.timestamp);

    // Calculate difference in minutes
    const diffInMinutes = Math.abs(
      (timestamp2.getTime() - timestamp1.getTime()) / (1000 * 60)
    );

    // Check for daily timeframe first
    if (diffInMinutes >= 1440) {
      // 24 hours
      return "1D";
    }

    // Round to nearest minute and match common timeframes
    const roundedMinutes = Math.round(diffInMinutes);

    switch (roundedMinutes) {
      case 1:
        return "1";
      case 5:
        return "5";
      case 15:
        return "15";
      default:
        return `D`;
    }
  };

  //added temproary reset on timeframe change
  useEffect(() => {
    if (
      prevTimeframeValue !== getIntervalFrom2Candles(data.at(-10), data.at(-9))
    ) {
      resetView();
      prevTimeframeValue = timeframeConfig.resolution;
    }
  }, [data.length]);

  // Add new ref for x-axis canvas
  const xAxisCanvasRef = useRef<HTMLCanvasElement>(null);

  // Add separate handler for x-axis canvas
  const handleXAxisMouseDown = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      e.preventDefault();
      setXAxisDragState({
        startX: e.clientX,
        startScaleX: viewState.scaleX,
      });
      e.currentTarget.style.cursor = "ew-resize";
    },
    [viewState.scaleX]
  );

  const handleXAxisMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (!xAxisDragState) return;

      const dx = e.clientX - xAxisDragState.startX;
      const scaleFactor = Math.exp(-dx / 200); // Use exponential scaling for smoother feel
      const newScaleX = Math.max(
        0.1,
        Math.min(5, xAxisDragState.startScaleX * scaleFactor)
      );

      const chartWidth =
        dimensions.width - dimensions.padding.left - dimensions.padding.right;
      const newVisibleBars = Math.floor(
        chartWidth / (BASE_CANDLE_WIDTH * newScaleX)
      );

      setViewState((prev) => {
        // Keep the center point fixed while scaling
        const centerBarIndex = prev.startIndex + prev.visibleBars / 2;
        const newStartIndex = Math.max(
          0,
          Math.min(
            combinedData.length - newVisibleBars,
            Math.floor(centerBarIndex - newVisibleBars / 2)
          )
        );

        return {
          ...prev,
          scaleX: newScaleX,
          visibleBars: newVisibleBars,
          startIndex: newStartIndex,
        };
      });
    },
    [xAxisDragState, dimensions, combinedData.length]
  );

  const handleXAxisMouseUp = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      setXAxisDragState(null);
      e.currentTarget.style.cursor = "default";
    },
    []
  );

  const handleXAxisMouseLeave = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (xAxisDragState) {
        setXAxisDragState(null);
        e.currentTarget.style.cursor = "default";
      }
    },
    [xAxisDragState]
  );

  // Add a function to calculate optimal label interval
  const calculateLabelInterval = useCallback(
    (barWidth: number) => {
      // Reduce the minimum pixels between labels
      const minPixelsBetweenLabels = 200; // Reduced from 500 to 200

      // Calculate how many bars we need between labels
      const barsNeeded = Math.ceil(minPixelsBetweenLabels / barWidth);

      // Get timeframe in minutes
      const timeframeMinutes = (() => {
        switch (timeframeConfig.resolution) {
          case "1":
            return 1;
          case "5":
            return 5;
          case "15":
            return 15;
          case "D":
            return 1440;
          default:
            return 1;
        }
      })();

      // Calculate total minutes needed for spacing
      const minutesNeeded = barsNeeded * timeframeMinutes;

      // Define intervals based on timeframe
      if (timeframeConfig.resolution === "D") {
        if (minutesNeeded <= 1440) return 1; // 1 day
        if (minutesNeeded <= 7200) return 5; // 5 days
        if (minutesNeeded <= 14400) return 10; // 10 days
        return 20; // 20 days
      }

      // For intraday timeframes, use dynamic calculation based on bar width
      const getIntraDayInterval = () => {
        // When bars are wide (zoomed in), show more granular labels
        if (barWidth >= 30) {
          // Increased threshold
          return 1;
        } else if (barWidth >= 20) {
          // Increased threshold
          return 2;
        } else if (barWidth >= 10) {
          // Increased threshold
          return 3;
        }

        // For more zoomed out views, calculate based on minutesNeeded
        if (minutesNeeded <= 30) return 5;
        if (minutesNeeded <= 60) return 10;
        if (minutesNeeded <= 120) return 20;
        if (minutesNeeded <= 240) return 40;
        if (minutesNeeded <= 480) return 80;
        if (minutesNeeded <= 960) return 160;

        return 320; // Reduced from 320 to 160
      };

      // Apply the interval based on timeframe resolution
      switch (timeframeConfig.resolution) {
        case "1":
          return getIntraDayInterval() * 2.5;
        case "5":
          return getIntraDayInterval() * 1; // Reduced multiplier from 5 to 3
        case "15":
          return getIntraDayInterval() * 2; // Reduced multiplier from 15 to 6
        default:
          return getIntraDayInterval();
      }
    },
    [timeframeConfig.resolution]
  );

  // Update the shouldDrawLabel logic in drawXAxisLabels
  const shouldDrawLabel = useCallback(
    (date: Date, barWidth: number) => {
      if (!date.getTime()) return false;

      const hours = date.getHours();
      const minutes = date.getMinutes();
      const totalMinutes = hours * 60 + minutes;
      const interval = calculateLabelInterval(barWidth);

      // Always show market open (9:15 AM)
      if (hours === 9 && minutes === 15) return true;

      // Always show day change (midnight)
      if (hours === 0 && minutes === 0) return true;

      // For daily timeframe
      if (timeframeConfig.resolution === "D") {
        return date.getDate() % interval === 0;
      }

      // Get resolution in minutes
      const resolutionMinutes =
        {
          "1": 1,
          "5": 5,
          "15": 15,
          D: 1440,
        }[timeframeConfig.resolution] || 1;

      // Calculate candle index from market open
      const marketOpenMinutes = 9 * 60 + 15;
      const minutesSinceMarketOpen =
        totalMinutes >= marketOpenMinutes
          ? totalMinutes - marketOpenMinutes
          : totalMinutes + (24 * 60 - marketOpenMinutes);

      const candleIndex = Math.floor(
        minutesSinceMarketOpen / resolutionMinutes
      );

      // Show label based on candle index and interval
      return candleIndex % interval === 0;
    },
    [timeframeConfig.resolution, calculateLabelInterval]
  );

  // Helper function to format date
  // const formatDate = (date: Date, showYear = false) => {
  //   const month = date.toLocaleString("default", { month: "short" });
  //   const day = date.getDate();
  //   const year = date.getFullYear();

  //   return showYear ? `${month}/${year}` : `${month}/${day}`;
  // };

  // Add this helper function near the top of the component to calculate x positions

  const calculateXAxisLabels = useMemo(() => {
    if (!combinedData.length) return [];

    const visibleData = combinedData.slice(
      Math.floor(viewState.startIndex),
      Math.floor(viewState.startIndex) + viewState.visibleBars
    );

    const fractionalOffset =
      viewState.startIndex - Math.floor(viewState.startIndex);
    const labels: { x: number; timestamp: number; text: string }[] = [];
    let lastDate: Date | null = null;
    let lastLabelX: number | null = null;
    const minLabelSpacing = 80;

    visibleData.forEach((candle, i) => {
      const x = calculateBarX(i, fractionalOffset);
      const date = new Date(candle.timestamp);
      const barWidth =
        (dimensions.width -
          dimensions.padding.left -
          dimensions.padding.right) /
        viewState.visibleBars;

      if (
        shouldDrawLabel(date, barWidth) &&
        x >= dimensions.padding.left &&
        x <= dimensions.width - dimensions.padding.right
      ) {
        // Check for minimum spacing between labels
        if (lastLabelX && x - lastLabelX < minLabelSpacing) {
          return;
        }

        labels.push({
          x,
          timestamp: candle.timestamp,
          text: formatTimeLabel(date, lastDate),
        });

        lastLabelX = x;
        lastDate = date;
      }
    });

    return labels;
  }, [
    combinedData,
    viewState.startIndex,
    viewState.visibleBars,
    dimensions.width,
    dimensions.padding,
    calculateBarX,
    shouldDrawLabel,
    formatTimeLabel,
  ]);

  // Update the drawXAxisLabels function
  const drawXAxisLabels = useCallback(
    (ctx: CanvasRenderingContext2D) => {
      const labels = calculateXAxisLabels;

      // Clear canvas
      ctx.clearRect(0, 0, dimensions.width, 30);

      // Draw labels
      labels.forEach(({ x, text }) => {
        // Draw tick mark
        ctx.beginPath();
        ctx.strokeStyle = currentTheme?.grid;
        ctx.lineWidth = 0.5;
        ctx.moveTo(x, 0);
        ctx.lineTo(x, 8);
        ctx.stroke();

        // Draw label
        const isDateChange = text.includes("/"); // Simple check for date labels

        if (isDateChange) {
          ctx.font = `bold 10px ${currentTheme.fontFamily}`;
          ctx.fillStyle = currentTheme?.text;
        } else {
          ctx.font = `10px ${currentTheme.fontFamily}`;
          ctx.fillStyle = currentTheme?.textSecondary;
        }

        ctx.textAlign = "center";
        ctx.fillText(text, x, 20);
      });
    },
    [calculateXAxisLabels, dimensions.width, currentTheme]
  );

  // First, create separate canvases for labels and crosshair
  const xAxisLabelsCanvasRef = useRef<HTMLCanvasElement>(null);
  const xAxisCrosshairCanvasRef = useRef<HTMLCanvasElement>(null);

  // Update the drawXAxisCrosshair function to include label drawing
  const drawXAxisCrosshair = useCallback(() => {
    if (!xAxisCrosshairCanvasRef.current || !currentTheme) return;

    const canvas = xAxisCrosshairCanvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas size with device pixel ratio
    const dpr = window.devicePixelRatio || 1;
    canvas.width = dimensions.width * dpr;
    canvas.height = 30 * dpr;
    ctx.scale(dpr, dpr);

    // Clear only the crosshair canvas
    ctx.clearRect(0, 0, dimensions.width, 30);

    if (xAxisCrosshair.visible) {
      const timeLabel = timeframeConfig.tickFormat(xAxisCrosshair.timestamp);
      const timeLabelWidth = ctx.measureText(timeLabel).width + 10;
      const timeLabelHeight = 20;

      // Calculate label position
      const minX = dimensions.padding.left;
      const maxX = dimensions.width - dimensions.padding.right;
      let labelX = xAxisCrosshair.x - timeLabelWidth / 2;

      // Adjust label position if outside bounds
      if (labelX < minX) {
        labelX = minX;
      } else if (labelX + timeLabelWidth > maxX) {
        labelX = maxX - timeLabelWidth;
      }

      // Draw label background
      ctx.fillStyle = currentTheme.grid;
      ctx.fillRect(
        labelX - 5,
        (30 - timeLabelHeight) / 2,
        timeLabelWidth + 10,
        timeLabelHeight
      );

      // Draw label text
      ctx.fillStyle = currentTheme.baseText + "d";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.font = `10px ${currentTheme.fontFamily}`;
      ctx.fillText(timeLabel, labelX + timeLabelWidth / 2, 30 / 2);
    }
  }, [xAxisCrosshair, dimensions, timeframeConfig, currentTheme]);

  // Update the grid and labels effect to use the labels canvas
  useEffect(() => {
    if (!gridCanvasRef.current || !xAxisLabelsCanvasRef.current) return;

    const gridCtx = gridCanvasRef.current.getContext("2d");
    const labelsCtx = xAxisLabelsCanvasRef.current.getContext("2d");
    if (!gridCtx || !labelsCtx) return;

    // Set canvas sizes with device pixel ratio
    const dpr = window.devicePixelRatio || 1;
    gridCanvasRef.current.width = dimensions.width * dpr;
    gridCanvasRef.current.height = dimensions.height * dpr;
    xAxisLabelsCanvasRef.current.width = dimensions.width * dpr;
    xAxisLabelsCanvasRef.current.height = 30 * dpr;

    gridCtx.scale(dpr, dpr);
    labelsCtx.scale(dpr, dpr);

    // Clear canvases
    gridCtx.clearRect(0, 0, dimensions.width, dimensions.height);
    labelsCtx.clearRect(0, 0, dimensions.width, 30);

    // Get calculated labels
    const labels = calculateXAxisLabels;

    // Draw grid lines
    labels.forEach(({ x }) => {
      gridCtx.beginPath();
      gridCtx.strokeStyle = currentTheme?.grid;
      gridCtx.lineWidth = 0.5;
      gridCtx.globalAlpha = 0.8;
      gridCtx.moveTo(x, 0);
      gridCtx.lineTo(x, dimensions.height - 30);
      gridCtx.stroke();
    });

    // Draw x-axis labels
    labels.forEach(({ x, text }) => {
      // Draw tick mark
      labelsCtx.beginPath();
      labelsCtx.strokeStyle = currentTheme?.grid;
      labelsCtx.lineWidth = 0.5;
      labelsCtx.moveTo(x, 0);
      labelsCtx.lineTo(x, 8);
      labelsCtx.stroke();

      // Draw label
      const isDateChange = text.includes("/");

      if (isDateChange) {
        labelsCtx.font = `bold 10px ${currentTheme.fontFamily}`;
        labelsCtx.fillStyle = currentTheme?.text;
      } else {
        labelsCtx.font = `10px ${currentTheme.fontFamily}`;
        labelsCtx.fillStyle = currentTheme?.textSecondary;
      }

      labelsCtx.textAlign = "center";
      labelsCtx.fillText(text, x, 20);
    });
  }, [calculateXAxisLabels, dimensions, currentTheme]);

  // Keep only one drawCrosshair function (the one that doesn't draw time labels)
  const drawCrosshair = useCallback(() => {
    if (!overlayCanvasRef.current || !mousePosition.visible || !currentTheme)
      return;

    const chartDims = getChartDimensions();
    const canvas = overlayCanvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas size with device pixel ratio
    const dpr = window.devicePixelRatio || 1;
    canvas.width = dimensions.width * dpr;
    canvas.height = dimensions.height * dpr;
    ctx.scale(dpr, dpr);

    // Clear previous crosshair
    ctx.clearRect(0, 0, dimensions.width, dimensions.height);

    // Set crosshair style
    ctx.setLineDash([4, 4]);
    ctx.lineWidth = 0.8;
    ctx.strokeStyle = currentTheme?.crosshair;

    // Calculate x-axis position and dimensions
    const xAxisTop = dimensions.height - 30;
    const xAxisHeight = 30;

    // Draw vertical line - extend to bottom of x-axis
    ctx.beginPath();
    ctx.moveTo(mousePosition.x, 0);
    ctx.lineTo(mousePosition.x, dimensions.height); // Extend through x-axis
    ctx.stroke();

    // Calculate chart areas without bottom padding
    const mainChartHeight =
      dimensions.height - (isRSIEnabled ? rsiHeight + 34 : 30);
    const chartBottom = mainChartHeight;

    // Calculate RSI area boundaries if enabled
    const rsiTop = mainChartHeight + 4;
    const rsiBottom = dimensions.height - 30;

    // Draw horizontal line based on area
    if (mousePosition.y <= chartBottom) {
      // Main chart area
      ctx.beginPath();
      ctx.moveTo(dimensions.padding.left, mousePosition.y);
      ctx.lineTo(dimensions.width - dimensions.padding.right, mousePosition.y);
      ctx.stroke();
    } else if (
      isRSIEnabled &&
      mousePosition.y >= rsiTop &&
      mousePosition.y <= rsiBottom
    ) {
      // RSI area
      ctx.beginPath();
      ctx.moveTo(dimensions.padding.left, mousePosition.y);
      ctx.lineTo(dimensions.width - dimensions.padding.right, mousePosition.y);
      ctx.stroke();
    }

    // Draw price label only in main chart area
    if (mousePosition.y <= chartBottom) {
      const priceLabel = round(mousePosition.price, 0.05).toFixed(2);
      const priceLabelWidth = ctx.measureText(priceLabel).width + 10;
      const priceLabelHeight = 20;

      // Price label background
      ctx.fillStyle = currentTheme.grid;
      ctx.fillRect(
        dimensions.width - dimensions.padding.right,
        mousePosition.y - priceLabelHeight / 2,
        priceLabelWidth,
        priceLabelHeight
      );

      // Price label text
      ctx.fillStyle = currentTheme.baseText + "d";
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      ctx.font = `10px ${currentTheme.fontFamily}`;
      ctx.fillText(
        priceLabel,
        dimensions.width - dimensions.padding.right + 5,
        mousePosition.y
      );
    }
  }, [
    mousePosition,
    dimensions,
    currentTheme,
    defaultTheme,
    isRSIEnabled,
    rsiHeight,
    getChartDimensions,
  ]);

  // Keep both effects
  useEffect(() => {
    drawCrosshair();
  }, [drawCrosshair]);

  useEffect(() => {
    drawXAxisCrosshair();
  }, [drawXAxisCrosshair]);

  useEffect(() => {
    if (!containerRef.current || !overlayCanvasRef.current) return;

    const resizeObserver = new ResizeObserver(() => {
      // Force update of canvas dimensions
      if (overlayCanvasRef.current) {
        const dpr = window.devicePixelRatio || 1;
        const rect = overlayCanvasRef.current.getBoundingClientRect();
        overlayCanvasRef.current.width = rect.width * dpr;
        overlayCanvasRef.current.height = rect.height * dpr;
      }
      // Redraw crosshair if visible
      if (mousePosition.visible) {
        drawCrosshair();
      }
    });

    resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();
    };
  }, [drawCrosshair, mousePosition.visible]);

  // Add back the scrollToRight function
  const scrollToRight = useCallback(() => {
    if (!data.length) return;

    const chartWidth =
      dimensions.width - dimensions.padding.left - dimensions.padding.right;
    const visibleBars = Math.floor(
      chartWidth / (BASE_CANDLE_WIDTH * viewState.scaleX)
    );

    // Calculate position to show last 70% of visible bars with real data
    const visibleDataBars = Math.floor(visibleBars * 0.7); // Show 70% of visible area
    const targetStartIndex = Math.max(0, data.length - visibleDataBars);

    // Create target state for animation
    const targetState: ViewState = {
      ...viewState,
      startIndex: targetStartIndex,
      visibleBars,
      offsetY: 0,
    };

    // Trigger animation
    animateViewState(targetState);
  }, [
    data.length,
    dimensions.width,
    dimensions.padding.left,
    dimensions.padding.right,
    viewState,
    animateViewState,
  ]);

  // Add back shouldShowScrollButton calculation
  const shouldShowScrollButton = useMemo(() => {
    if (!data.length) return false;

    const chartWidth =
      dimensions.width - dimensions.padding.left - dimensions.padding.right;
    const visibleBars = Math.floor(
      chartWidth / (BASE_CANDLE_WIDTH * viewState.scaleX)
    );
    const currentLastVisibleIndex = viewState.startIndex + visibleBars;

    // Show button if there are more than 10 candles to scroll to
    return data.length - currentLastVisibleIndex > 10;
  }, [data.length, dimensions, viewState.startIndex, viewState.scaleX]);

  // Add back handleYAxisDoubleClick
  const handleYAxisDoubleClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      // Check if click is within Y-axis area (right side of chart)
      if (x < dimensions.width - dimensions.padding.right) {
        return;
      }

      // Check if click is within the main chart area (excluding RSI if enabled)
      const mainChartHeight =
        dimensions.height - (isRSIEnabled ? rsiHeight + 34 : 30);
      if (y < dimensions.padding.top || y > mainChartHeight) {
        return;
      }
      e.stopPropagation();

      // Only if we're in the Y-axis area, proceed with the rest of the logic
      // Get visible data
      const visibleData = combinedData.slice(
        viewState.startIndex,
        viewState.startIndex + viewState.visibleBars
      );

      // Calculate price range from visible data
      const prices = visibleData.flatMap((candle) => [candle.high, candle.low]);
      const minPrice = Math.min(...prices);
      const maxPrice = Math.max(...prices);
      const priceRange = maxPrice - minPrice;

      // Calculate padding (5% of price range)
      const padding = priceRange * 0.05;

      // Calculate chart height
      const chartHeight =
        dimensions.height -
        dimensions.padding.top -
        dimensions.padding.bottom -
        (isRSIEnabled ? rsiHeight + 34 : 30);

      // Calculate base scale (inverse relationship with chart height)
      const baseScale = 650 / chartHeight; // 400 is a reference height
      const targetRange = priceRange + padding * 2;
      const newScaleY = baseScale * (chartHeight / targetRange) - 4;

      // Create target state for animation
      const targetState: ViewState = {
        ...viewState,
        scaleY: 0.3,
        offsetY: calculateInitialOffset(data),
      };

      // Animate to new state
      animateViewState(targetState);
    },
    [dimensions, viewState, combinedData, isRSIEnabled, rsiHeight]
  );

  // Add this function with the other handlers
  const handleXAxisDoubleClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      e.stopPropagation();
      const chartWidth =
        dimensions.width - dimensions.padding.left - dimensions.padding.right;

      // Calculate scale needed for ~10px candle width
      const targetCandleWidth = 8;
      const newScaleX = targetCandleWidth / BASE_CANDLE_WIDTH;
      const newVisibleBars = Math.floor(chartWidth / targetCandleWidth);

      // Calculate new start index to center around current view
      const currentCenterIndex =
        viewState.startIndex + viewState.visibleBars / 2;
      const newStartIndex = Math.max(
        0,
        Math.min(
          combinedData.length - newVisibleBars,
          Math.floor(currentCenterIndex - newVisibleBars / 2)
        )
      );

      // Create target state for animation
      const targetState: ViewState = {
        ...viewState,
        scaleX: newScaleX,
        visibleBars: newVisibleBars,
        startIndex: newStartIndex,
      };

      // Animate to new state
      animateViewState(targetState);
    },
    [dimensions, viewState, combinedData.length, animateViewState]
  );

  // Add new canvas ref
  const gridCanvasRef = useRef<HTMLCanvasElement>(null);

  // First, add a function to draw grid lines
  const drawGridLines = useCallback(
    (ctx: CanvasRenderingContext2D) => {
      if (!ctx || !priceRangeData) return;

      // Clear the grid canvas
      ctx.clearRect(0, 0, dimensions.width, dimensions.height);

      const chartHeight =
        dimensions.height - (isRSIEnabled ? rsiHeight + 34 : 30);
      const { gridPrices } = calculateGridPrices(chartHeight, getY);

      // Draw horizontal grid lines
      gridPrices.forEach((price) => {
        const y = getY(price, chartHeight);
        ctx.beginPath();
        ctx.strokeStyle = currentTheme?.grid;
        ctx.lineWidth = 0.5;
        ctx.globalAlpha = 0.8;
        ctx.moveTo(dimensions.padding.left, y);
        ctx.lineTo(dimensions.width - dimensions.padding.right, y);
        ctx.stroke();
      });

      // Draw vertical grid lines
      const labels = calculateXAxisLabels;
      labels.forEach(({ x }) => {
        ctx.beginPath();
        ctx.strokeStyle = currentTheme?.grid;
        ctx.lineWidth = 0.5;
        ctx.globalAlpha = 0.8;
        ctx.moveTo(x, dimensions.padding.top);
        ctx.lineTo(x, dimensions.height);
        ctx.stroke();
      });
    },
    [
      dimensions,
      priceRangeData,
      isRSIEnabled,
      rsiHeight,
      getY,
      calculateGridPrices,
      currentTheme,
      calculateXAxisLabels,
    ]
  );

  // Add new canvas ref for y-axis
  const yAxisCanvasRef = useRef<HTMLCanvasElement>(null);

  // Update the main render effect to ensure it runs when needed
  useEffect(() => {
    if (
      !gridCanvasRef.current ||
      !yAxisCanvasRef.current ||
      !mainCanvasRef.current
    )
      return;

    const gridCtx = gridCanvasRef.current.getContext("2d");
    const mainCtx = mainCanvasRef.current.getContext("2d");
    const yAxisCtx = yAxisCanvasRef.current.getContext("2d");

    if (!gridCtx || !mainCtx || !yAxisCtx) return;

    // Set canvas sizes with device pixel ratio
    const dpr = window.devicePixelRatio || 1;

    // Set main and grid canvas sizes
    [gridCanvasRef.current, mainCanvasRef.current].forEach((canvas) => {
      canvas.width = dimensions.width * dpr;
      canvas.height = dimensions.height * dpr;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.scale(dpr, dpr);
      }
    });

    // Set y-axis canvas size
    yAxisCanvasRef.current.width = dimensions.padding.right * dpr;
    yAxisCanvasRef.current.height = dimensions.height * dpr;
    yAxisCtx.scale(dpr, dpr);

    // Draw in correct order
    requestAnimationFrame(() => {
      drawGridLines(gridCtx);
      drawChart(mainCtx);
      drawYAxisLabels(yAxisCtx);
    });
  }, [
    dimensions,
    viewState.startIndex,
    viewState.visibleBars,
    viewState.scaleY,
    viewState.offsetY,
    data.length,
    drawGridLines,
    drawChart,
    drawYAxisLabels,
  ]);

  useEffect(() => {
    if (!yAxisCanvasRef.current) return;
    const ctx = yAxisCanvasRef.current.getContext("2d");
    if (!ctx) return;

    // Set canvas size with device pixel ratio
    const dpr = window.devicePixelRatio || 1;
    yAxisCanvasRef.current.width = dimensions.padding.right * dpr;
    yAxisCanvasRef.current.height = dimensions.height * dpr;
    ctx.scale(dpr, dpr);

    drawYAxisLabels(ctx);
  }, [dimensions, drawYAxisLabels]);

  // Add these calculations before the return statement, where we have access to the data
  const renderDrawingCanvas = () => {
    // Get visible data for price calculations
    const visibleData = combinedData.slice(
      Math.floor(viewState.startIndex),
      Math.floor(viewState.startIndex) + viewState.visibleBars
    );

    // Calculate price ranges
    const prices = visibleData.flatMap((candle) => [candle.high, candle.low]);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const priceRange = maxPrice - minPrice;
    const pricePadding = priceRange * 0.15;

    // Calculate adjusted price range with padding and offset
    // Note: We're not dividing by scaleY here since we handle it in the DrawingCanvas
    const adjustedMinPrice = minPrice - pricePadding + viewState.offsetY;
    const adjustedMaxPrice = maxPrice + pricePadding + viewState.offsetY;

    // Convert drawings to data index coordinates for rendering
    const drawingsForCanvas = useMemo(() => {
      return convertDrawingsToDataIndex(drawings, combinedData);
    }, [drawings, combinedData.length]);

    // Wrap the drawing handlers to convert coordinates
    const handleDrawingComplete = useCallback(
      (drawing: Drawing) => {
        const timestampDrawing = convertDrawingToTimestamp(
          drawing,
          combinedData
        );
        onDrawingComplete(timestampDrawing);
      },
      [combinedData, onDrawingComplete]
    );

    const handleDrawingUpdate = useCallback(
      (drawing: Drawing) => {
        const timestampDrawing = convertDrawingToTimestamp(
          drawing,
          combinedData
        );
        onDrawingUpdate(timestampDrawing);
      },
      [combinedData, onDrawingUpdate]
    );

    const selectedDrawing = useSelector(
      (state: RootState) => state.globalChart.selectedDrawing
    );

    return (
      <DrawingCanvas
        priceRangeData={priceRangeData} // Replace data prop with this
        drawings={drawingsForCanvas}
        dimensions={dimensions}
        theme={currentTheme}
        selectedTool={selectedTool}
        showDrawings={showDrawings}
        viewState={{
          ...viewState,
          minPrice: adjustedMinPrice,
          maxPrice: adjustedMaxPrice,
          rsiHeight: isRSIEnabled ? rsiHeight + 34 : 0,
        }}
        mousePosition={drawingCanvasMousePos}
        handleMouseMoveForCrosshair={handleMouseMoveForCrosshair}
        onDrawingComplete={handleDrawingComplete}
        onDrawingUpdate={handleDrawingUpdate}
        xAxisCrosshair={xAxisCrosshair}
        chartState={chartState}
        selectedDrawing={selectedDrawing}
        disableHandleInteraction={!!dragState?.mode}
      />
    );
  };

  // Add state for current click price
  const [currentClickPrice, setCurrentClickPrice] = useState<
    number | undefined
  >(undefined);

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isCleanClick && mousePosition.visible) {
      setCurrentClickPrice(mousePosition.price);
    }
  };

  // Then in the return statement, replace the DrawingCanvas component with:
  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        background: currentTheme?.background,
        display: "flex",
        flexDirection: "column",
      }}
    >
      <ScrollToRightButton
        onClick={scrollToRight}
        theme={currentTheme}
        isVisible={shouldShowScrollButton}
      />

      {/* Main container with chart, RSI, and crosshair */}
      <div style={{ position: "relative", flex: 1 }}>
        {/* Event handling container */}
        <div
          ref={containerRef}
          style={{
            position: "relative",
            width: "100%",
            height: "100%",
            cursor: isDragging ? "grabbing" : "crosshair",
            touchAction: "none",
          }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseLeave}
          onWheel={handleWheel}
          onDoubleClick={handleYAxisDoubleClick}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onClick={handleClick}
        >
          {/* Grid Canvas - Bottom layer */}
          <canvas
            ref={gridCanvasRef}
            id={"gridCanvasRef"}
            style={{
              width: "100%",
              height: "100%",
              position: "absolute",
              top: 0,
              left: 0,
              zIndex: 1,
            }}
          />

          {/* Main Chart Canvas - Middle layer */}
          <canvas
            ref={mainCanvasRef}
            id="mainCanvasRef"
            style={{
              width: "100%",
              height: "100%",
              position: "absolute",
              top: 0,
              left: 0,
              zIndex: 4,
            }}
          />

          {/* Y-axis Canvas - Right side only */}
          <canvas
            ref={yAxisCanvasRef}
            style={{
              width: `${dimensions.padding.right}px`,
              height: "100%",
              position: "absolute",
              top: 0,
              right: 0,
              zIndex: 3,
              backgroundColor: currentTheme?.background, // Add this to match chart background
            }}
          />

          {/* RSI Section */}
          {isRSIEnabled && (
            <>
              <div
                style={{
                  height: "4px",
                  backgroundColor: currentTheme?.grid,
                  cursor: "ns-resize",
                  position: "absolute",
                  bottom: `${rsiHeight}px`,
                  width: "100%",
                  zIndex: 20,
                }}
                onMouseDown={handleRSISeparatorMouseDown}
              >
                <div
                  style={{
                    position: "absolute",
                    left: "50%",
                    top: "50%",
                    transform: "translate(-50%, -50%)",
                    width: "30px",
                    height: "2px",
                    backgroundColor: currentTheme?.text,
                    opacity: isDraggingRSI ? 0.8 : 0.5,
                    transition: "opacity 0.2s ease",
                  }}
                />
              </div>

              <div style={rsiContainerStyle}>
                <RSIIndicator
                  data={combinedData}
                  dimensions={{
                    ...dimensions,
                    padding: {
                      ...dimensions.padding,
                      bottom: 0,
                    },
                  }}
                  theme={currentTheme}
                  period={14}
                  height={rsiHeight}
                  startIndex={viewState.startIndex}
                  visibleBars={viewState.visibleBars}
                />
              </div>
            </>
          )}

          {/* Crosshair Overlay - Top layer */}
          <canvas
            ref={overlayCanvasRef}
            style={{
              width: "100%",
              height: "100%",
              position: "absolute",
              top: 0,
              left: 0,
              zIndex: 4,
              pointerEvents: "none",
            }}
          />
        </div>
      </div>

      {/* X-Axis Area */}
      <div
        style={{
          height: "30px",
          borderTop: `1px solid ${currentTheme?.grid}`,
          position: "relative",
        }}
      >
        {/* Labels canvas - bottom layer */}
        <canvas
          ref={xAxisLabelsCanvasRef}
          id={"xAxisLabelsCanvasRef"}
          style={{
            width: "100%",
            height: "30px",
            position: "absolute",
            top: 0,
            left: 0,
            zIndex: 1,
          }}
        />
        {/* Crosshair canvas - top layer */}
        <canvas
          ref={xAxisCrosshairCanvasRef}
          style={{
            width: "100%",
            height: "30px",
            position: "absolute",
            top: 0,
            left: 0,
            pointerEvents: "auto",
            cursor: xAxisDragState ? "ew-resize" : "default",
            zIndex: 2,
          }}
          onMouseDown={handleXAxisMouseDown}
          onMouseMove={handleXAxisMouseMove}
          onMouseUp={handleXAxisMouseUp}
          onMouseLeave={handleXAxisMouseLeave}
          onDoubleClick={handleXAxisDoubleClick}
        />
      </div>

      {renderDrawingCanvas()}

      {/* Bottom Action Bar Container */}
      <ActionButtons
        handleZoom={handleZoom}
        handlePan={handlePan}
        resetView={resetView}
        rsiHeight={isRSIEnabled ? rsiHeight : 0}
      />

      <BuySellWindow
        chartState={chartState}
        currentPrice={currentClickPrice}
        rsiHeight={isRSIEnabled ? rsiHeight : 0}
      />
    </div>
  );
};

export default CanvasChart;
