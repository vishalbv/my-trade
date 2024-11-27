import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import {
  OHLCData,
  TimeframeConfig,
  ChartDimensions,
  ChartTheme,
  ViewState,
  Indicator,
} from "./types";
import { themes } from "./constants/themes";
import { useTheme } from "next-themes";
import { RSIIndicator } from "./components/RSIIndicator";
import { ScrollToRightButton } from "./components/ScrollToRightButton";

interface CanvasChartProps {
  data: OHLCData[];
  timeframeConfig: TimeframeConfig;
  indicators: Indicator[];
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

const CanvasChart: React.FC<CanvasChartProps> = ({
  data,
  timeframeConfig,
  indicators,
}) => {
  const isRSIEnabled = indicators.some(
    (indicator) => indicator.id === "rsi" && indicator.enabled
  );

  // Update the state declarations
  const [rsiHeight, setRsiHeight] = useState<number>(100);
  const [isDraggingRSI, setIsDraggingRSI] = useState(false);
  const [dragStartY, setDragStartY] = useState<number>(0);
  const [dragStartHeight, setDragStartHeight] = useState<number>(0);

  const mainCanvasRef = useRef<HTMLCanvasElement>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { theme } = useTheme();
  const defaultTheme = themes.dark!; // Ensure dark theme exists
  const currentTheme = themes[theme as keyof typeof themes] || defaultTheme;

  const [dimensions, setDimensions] = useState<ChartDimensions>({
    width: 0,
    height: 0,
    padding: { top: 20, right: 60, bottom: 30, left: 10 },
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
  const createDummyCandles = useCallback(
    (lastCandle: OHLCData | undefined, count: number): OHLCData[] => {
      if (!lastCandle) return [];

      const dummyCandles: OHLCData[] = [];
      let currentDate = new Date(lastCandle.timestamp);

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
            break;
          default:
            nextDate.setMinutes(nextDate.getMinutes() + 1);
        }

        // Skip non-trading hours (before 9:15 AM and after 3:30 PM)
        const hours = nextDate.getHours();
        const minutes = nextDate.getMinutes();

        if (
          hours < 9 ||
          (hours === 9 && minutes < 15) ||
          hours > 15 ||
          (hours === 15 && minutes > 29)
        ) {
          // Set to next trading day at 9:15 AM
          nextDate.setDate(nextDate.getDate() + 1);
          nextDate.setHours(9, 15, 0, 0);
        }

        dummyCandles.push({
          timestamp: nextDate.getTime(),
          open: lastCandle.close,
          high: lastCandle.close,
          low: lastCandle.close,
          close: lastCandle.close,
          volume: 0,
          display: false,
        });

        currentDate = nextDate;
      }

      return dummyCandles;
    },
    [timeframeConfig]
  );

  // Update the combinedData calculation in the useMemo hook
  const combinedData = useMemo(() => {
    if (!data.length) return [];

    // Always create 500 dummy candles regardless of chart width
    const dummyCandles = createDummyCandles(data[data.length - 1], 500);
    return [...data, ...dummyCandles];
  }, [data, createDummyCandles]);

  // Update the initialization effect
  useEffect(() => {
    if (!dimensions.width || !combinedData.length) return;

    // Only set initial view state if it hasn't been set before
    if (viewState.visibleBars === 0) {
      const chartWidth =
        dimensions.width - dimensions.padding.left - dimensions.padding.right;
      const initialVisibleBars = Math.floor(chartWidth / 10);

      // Calculate how many bars to show initially with 30% empty space
      const visibleDataBars = Math.floor(initialVisibleBars * 0.7); // Show 70% of visible area
      const emptySpaceBars = Math.floor(initialVisibleBars * 0.3); // 30% empty space

      // Calculate start index to show the last portion of real data plus some dummy candles
      const startIndex = Math.max(0, data.length - visibleDataBars);

      setViewState({
        scaleX: 1,
        scaleY: 1,
        offsetX: 0,
        offsetY: 0,
        startIndex,
        visibleBars: initialVisibleBars,
        theme: currentTheme,
      });
    } else {
      // When new data arrives, adjust startIndex to maintain current view position
      setViewState((prev) => ({
        ...prev,
        startIndex: Math.max(0, prev.startIndex + 1), // Shift one candle to maintain position
        theme: currentTheme,
      }));
    }
  }, [combinedData.length, dimensions.width, currentTheme, data.length]);

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

  // Update handleMouseDown to detect drag on xAxisCanvas
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

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
    } else if (
      x >= dimensions.padding.left &&
      x <= dimensions.width - dimensions.padding.right
    ) {
      setDragState({
        mode: "pan",
        startX: e.clientX,
        startY: e.clientY,
        startScaleX: viewState.scaleX,
        startScaleY: viewState.scaleY,
        startIndex: viewState.startIndex,
        startOffsetY: viewState.offsetY,
      });
      e.currentTarget.style.cursor = "grabbing";
    }
  };

  // Update handleMouseMove
  const handleMouseMove = (e: React.MouseEvent) => {
    handleMouseMoveForCrosshair(e);

    if (!dragState) return;

    switch (dragState.mode) {
      case "scaleY": {
        const dy = dragState.startY - e.clientY;
        const scaleFactor = 1 + dy / 200; // Adjust sensitivity as needed
        const newScaleY = Math.max(
          0.1,
          Math.min(5, dragState.startScaleY * scaleFactor)
        );

        setViewState((prev) => ({
          ...prev,
          scaleY: newScaleY,
        }));
        break;
      }
      case "pan": {
        // Calculate horizontal movement in bars
        const dx = e.clientX - dragState.startX;
        const chartWidth =
          dimensions.width - dimensions.padding.left - dimensions.padding.right;
        const barWidth = chartWidth / viewState.visibleBars;
        const barsToMove = dx / barWidth;

        // Calculate vertical movement in price
        const dy = e.clientY - dragState.startY;
        const chartHeight =
          dimensions.height -
          dimensions.padding.top -
          dimensions.padding.bottom -
          (isRSIEnabled ? rsiHeight + 34 : 30);

        // Get visible data for price range calculation
        const visibleData = combinedData.slice(
          Math.floor(dragState.startIndex),
          Math.floor(dragState.startIndex) + viewState.visibleBars
        );

        // Calculate price range from visible data
        const prices = visibleData.flatMap((candle) => [
          candle.high,
          candle.low,
        ]);
        const minPrice = Math.min(...prices);
        const maxPrice = Math.max(...prices);
        const priceRange = maxPrice - minPrice;
        const pricePadding = priceRange * 0.1;
        const totalPriceRange =
          (priceRange + 2 * pricePadding) / viewState.scaleY;

        // Calculate the price movement
        const pricePerPixel = totalPriceRange / chartHeight;
        const priceMove = dy * pricePerPixel;

        // Update view state with new position
        setViewState((prev) => {
          // Calculate new start index while preventing overscroll
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
            // Keep scales exactly as they were at drag start
            scaleX: dragState.startScaleX,
            scaleY: dragState.startScaleY,
          };
        });
        break;
      }
    }
  };

  // Update handleMouseUp
  const handleMouseUp = (e: React.MouseEvent<HTMLDivElement>) => {
    setDragState(null);
    e.currentTarget.style.cursor = "crosshair";
  };

  // Update handleMouseLeave
  const handleMouseLeave = (e: React.MouseEvent<HTMLDivElement>) => {
    if (dragState) {
      setDragState(null);
      e.currentTarget.style.cursor = "crosshair";
    }
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
      const visibleBars = Math.floor(chartWidth / (10 * viewState.scaleX));

      setViewState((prev) => ({
        ...prev,
        offsetX: 0,
        offsetY: 0,
        startIndex: Math.max(0, data.length - visibleBars),
        visibleBars,
        theme: currentTheme,
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

      const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
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

  // Update the handleMouseMoveForCrosshair function
  const handleMouseMoveForCrosshair = useCallback(
    (e: React.MouseEvent) => {
      if (!overlayCanvasRef.current || !containerRef.current || !data.length)
        return;

      const chartDims = getChartDimensions();

      // Get container and overlay bounds
      const containerRect = containerRef.current.getBoundingClientRect();
      const overlayRect = overlayCanvasRef.current.getBoundingClientRect();

      // Calculate the scaling factor between CSS pixels and canvas pixels
      const dpr = window.devicePixelRatio || 1;
      const scaleX = overlayCanvasRef.current.width / overlayRect.width / dpr;
      const scaleY = overlayCanvasRef.current.height / overlayRect.height / dpr;

      // Get mouse position relative to container
      const cssX = e.clientX - containerRect.left;
      const cssY = e.clientY - containerRect.top;

      // Convert to canvas pixels
      const displayX = cssX * scaleX;
      const displayY = cssY * scaleY;

      // Check if within chart bounds
      if (
        displayX >= dimensions.padding.left &&
        displayX <= dimensions.width - dimensions.padding.right
      ) {
        // Calculate bar width and position
        const chartWidth =
          dimensions.width - dimensions.padding.left - dimensions.padding.right;
        const barWidth = chartWidth / viewState.visibleBars;

        // Calculate which bar we're hovering over
        const mouseX = displayX - dimensions.padding.left;
        const barIndex = Math.floor(mouseX / barWidth);

        // Calculate the center of the bar
        const barCenterX =
          dimensions.padding.left + (barIndex + 0.5) * barWidth;

        // Get visible data
        const visibleData = combinedData.slice(
          viewState.startIndex,
          viewState.startIndex + viewState.visibleBars
        );

        if (
          !visibleData.length ||
          barIndex < 0 ||
          barIndex >= visibleData.length
        )
          return;

        const candle = visibleData[barIndex];
        const timestamp = candle ? candle.timestamp : 0;

        // Calculate price only if in main chart area
        let price = 0;
        if (displayY <= chartDims.mainChartBottom) {
          // Get price range from visible data
          const prices = visibleData.flatMap((candle) => [
            candle.high,
            candle.low,
          ]);
          const minPrice = Math.min(...prices);
          const maxPrice = Math.max(...prices);
          const priceRange = maxPrice - minPrice;
          const pricePadding = priceRange * 0.15;

          // Calculate adjusted price range with padding and scale
          const adjustedMinPrice = minPrice - pricePadding + viewState.offsetY;
          const adjustedMaxPrice = maxPrice + pricePadding + viewState.offsetY;
          const adjustedPriceRange =
            (adjustedMaxPrice - adjustedMinPrice) / viewState.scaleY;

          // Calculate chart height excluding padding
          const chartHeight =
            dimensions.height -
            dimensions.padding.top -
            dimensions.padding.bottom -
            (isRSIEnabled ? rsiHeight + 34 : 30);

          // Calculate price based on mouse position
          const priceRatio =
            (displayY - dimensions.padding.top) /
            (chartHeight - dimensions.padding.top);
          price = adjustedMaxPrice - priceRatio * adjustedPriceRange;
        }

        // Always use the bar center for x position
        setXAxisCrosshair({
          x: barCenterX,
          timestamp: timestamp,
          visible: true,
        });

        setMousePosition({
          x: barCenterX,
          y: displayY,
          price,
          timestamp,
          visible: true,
        });
      } else {
        setXAxisCrosshair((prev) => ({ ...prev, visible: false }));
        setMousePosition((prev) => ({ ...prev, visible: false }));
      }
    },
    [
      dimensions,
      data,
      viewState,
      combinedData,
      isRSIEnabled,
      rsiHeight,
      getChartDimensions,
    ]
  );

  // Add resize observer effect if not already present

  // Update the calculateTimeStep function for better time intervals
  const calculateTimeStep = (
    timeRange: number,
    visibleBars: number
  ): number => {
    const msPerDay = 86400000;
    const msPerHour = 3600000;
    const msPerMinute = 60000;

    // More granular time steps like TradingView
    if (timeRange > msPerDay * 5) return msPerDay; // Daily
    if (timeRange > msPerDay) return msPerHour * 6; // 6 hours
    if (timeRange > msPerHour * 12) return msPerHour * 2; // 2 hours
    if (timeRange > msPerHour * 4) return msPerHour; // 1 hour
    if (timeRange > msPerHour * 2) return msPerMinute * 30; // 30 minutes
    if (timeRange > msPerHour) return msPerMinute * 15; // 15 minutes
    if (timeRange > msPerMinute * 30) return msPerMinute * 5; // 5 minutes
    return msPerMinute; // 1 minute
  };

  // Update formatTimeLabel function to be more intelligent
  const formatTimeLabel = (timestamp: number, timeRange: number): string => {
    const date = new Date(timestamp);
    const msPerDay = 86400000;
    const msPerHour = 3600000;

    // Format based on range and time
    if (timeRange > msPerDay * 5) {
      // Show month and day for longer ranges
      return date.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
      });
    } else if (timeRange > msPerDay) {
      // Show date and time for multi-day ranges
      return `${date.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
      })} ${date.toLocaleTimeString(undefined, {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      })}`;
    } else {
      // For same day, check if it's at market open or significant hour
      const minutes = date.getHours() * 60 + date.getMinutes();
      if (minutes === 555) {
        // 9:15 AM
        return `${date.toLocaleDateString()} ${date.toLocaleTimeString(
          undefined,
          {
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
          }
        )}`;
      }
      // Show only time for intraday
      return date.toLocaleTimeString(undefined, {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      });
    }
  };

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
  const willLabelsOverlap = (
    ctx: CanvasRenderingContext2D,
    labels: { x: number; text: string }[],
    minSpacing: number
  ): boolean => {
    for (let i = 1; i < labels.length; i++) {
      const prevLabel = labels[i - 1];
      const currentLabel = labels[i];
      if (!prevLabel || !currentLabel) continue;
      const prevWidth = ctx.measureText(prevLabel.text).width;
      const spacing = currentLabel.x - (prevLabel.x + prevWidth);
      if (spacing < minSpacing) return true;
    }
    return false;
  };

  // Add this before calculateGridPrices
  const getY = useCallback(
    (
      price: number,
      adjustedMinPrice: number,
      adjustedMaxPrice: number,
      chartHeight: number
    ) => {
      const mainChartHeight =
        dimensions.height - (isRSIEnabled ? rsiHeight + 34 : 30);
      const adjustedPriceRange =
        (adjustedMaxPrice - adjustedMinPrice) / viewState.scaleY;
      return (
        dimensions.padding.top +
        ((adjustedMaxPrice - price) / adjustedPriceRange) *
          (mainChartHeight - dimensions.padding.top - dimensions.padding.bottom)
      );
    },
    [dimensions, viewState.scaleY, isRSIEnabled, rsiHeight]
  );

  // Update calculateGridPrices to accept getY function
  const calculateGridPrices = useCallback(
    (
      minPrice: number,
      maxPrice: number,
      adjustedMinPrice: number,
      adjustedMaxPrice: number,
      chartHeight: number,
      getYFunc: (
        price: number,
        min: number,
        max: number,
        height: number
      ) => number
    ): { gridPrices: number[]; priceLabels: { y: number; text: string }[] } => {
      // Calculate nice grid step based on scale
      const visiblePriceRange = adjustedMaxPrice - adjustedMinPrice;

      // Adjust number of ticks based on scale and chart height
      const baseTickCount = Math.max(6, Math.floor(chartHeight / 50));
      const scaleBasedTicks = Math.ceil(baseTickCount * viewState.scaleY);
      const maxPriceTicks = Math.min(
        20,
        Math.max(baseTickCount, scaleBasedTicks)
      );

      // Calculate initial grid step
      let gridPriceStep = calculateNiceNumber(visiblePriceRange, maxPriceTicks);

      // Adjust step size based on price range and scale
      const minStepSize = visiblePriceRange * 0.001;
      const maxStepSize = visiblePriceRange * 0.2;

      gridPriceStep = Math.max(
        minStepSize,
        Math.min(maxStepSize, gridPriceStep / viewState.scaleY)
      );

      // Extend the range for grid lines (especially below)
      const extendedMinPrice = adjustedMinPrice - gridPriceStep * 100; // Extend 100 steps below
      const extendedMaxPrice = adjustedMaxPrice + gridPriceStep * 2;

      // Calculate grid prices
      const firstGridPrice =
        Math.floor(extendedMinPrice / gridPriceStep) * gridPriceStep;
      const gridPrices: number[] = [];
      const priceLabels: { y: number; text: string }[] = [];

      // Add grid lines with dynamic spacing
      for (
        let price = firstGridPrice;
        price <= extendedMaxPrice;
        price += gridPriceStep
      ) {
        const y = getYFunc(
          price,
          adjustedMinPrice,
          adjustedMaxPrice,
          chartHeight
        );

        // Include prices with extended visibility range, especially below
        const extendedPadding = 50 * viewState.scaleY;
        const extendedBottomPadding = chartHeight * 2; // Allow more space below

        if (
          y >= dimensions.padding.top - extendedPadding &&
          y <= chartHeight + dimensions.padding.bottom + extendedBottomPadding
        ) {
          // Check minimum spacing between lines
          const minSpacing = 20 / viewState.scaleY;
          const lastY = priceLabels[priceLabels.length - 1]?.y;

          if (!lastY || Math.abs(y - lastY) >= minSpacing) {
            gridPrices.push(price);
            priceLabels.push({
              y,
              text: price.toFixed(2),
            });
          }
        }
      }

      return { gridPrices, priceLabels };
    },
    [dimensions, viewState.scaleY]
  );

  // Update the RSI separator mouse down handler
  const handleRSISeparatorMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDraggingRSI(true);
    setDragStartY(e.clientY);
    setDragStartHeight(rsiHeight);
  };

  // Add this function to calculate clip boundaries
  const getClipBoundaries = useCallback(() => {
    const chartWidth =
      dimensions.width - dimensions.padding.left - dimensions.padding.right;
    const totalHeight =
      dimensions.height - (isRSIEnabled ? rsiHeight + 34 : 30);
    const chartHeight =
      totalHeight - dimensions.padding.top - dimensions.padding.bottom;

    return {
      left: chartWidth, // 1x chart width to the left
      right: chartWidth, // 1x chart width to the right
      top: chartHeight, // 1x chart height to the top
      bottom: chartHeight, // 1x chart height to the bottom
    };
  }, [
    dimensions.width,
    dimensions.height,
    dimensions.padding,
    isRSIEnabled,
    rsiHeight,
  ]);

  // Update the drawChart function to use dynamic clip boundaries
  const drawChart = useCallback(
    (ctx: CanvasRenderingContext2D) => {
      // Clear canvas
      ctx.clearRect(0, 0, dimensions.width, dimensions.height);

      // Calculate chart dimensions
      const chartWidth =
        dimensions.width - dimensions.padding.left - dimensions.padding.right;

      // Update this part to properly calculate chart height when RSI is enabled
      const totalHeight =
        dimensions.height - (isRSIEnabled ? rsiHeight + 34 : 30);
      const chartHeight =
        totalHeight - dimensions.padding.top - dimensions.padding.bottom;

      // Calculate candle dimensions using scaleX
      const barWidth = BASE_CANDLE_WIDTH * viewState.scaleX;
      const candleWidth = barWidth * 0.8;

      // Get visible data
      const visibleStartIndex = Math.floor(viewState.startIndex);
      const visibleData = combinedData.slice(
        visibleStartIndex,
        visibleStartIndex + viewState.visibleBars
      );

      if (!visibleData.length) return;

      // Calculate price range from visible data
      const prices = visibleData.flatMap((candle) => [candle.high, candle.low]);
      const minPrice = Math.min(...prices);
      const maxPrice = Math.max(...prices);
      const priceRange = maxPrice - minPrice;
      const pricePadding = priceRange * 0.15; // Increased padding

      // Calculate adjusted price range with extended padding
      const adjustedMinPrice = minPrice - pricePadding + viewState.offsetY;
      const adjustedMaxPrice = maxPrice + pricePadding + viewState.offsetY;
      const adjustedPriceRange = adjustedMaxPrice - adjustedMinPrice;

      // Get grid prices and labels
      const { gridPrices, priceLabels } = calculateGridPrices(
        minPrice,
        maxPrice,
        adjustedMinPrice,
        adjustedMaxPrice,
        chartHeight,
        getY
      );

      // Draw vertical grid lines first (before candlesticks)
      const fractionalOffset =
        viewState.startIndex - Math.floor(viewState.startIndex);

      // visibleData.forEach((candle, i) => {
      //   const candleCenterX =
      //     dimensions.padding.left +
      //     (i - fractionalOffset) * barWidth +
      //     barWidth / 2;
      //   const date = new Date(candle.timestamp);
      //   const minutes = date.getMinutes();
      //   const hours = date.getHours();

      //   if (minutes === 0 || (hours === 9 && minutes === 15)) {
      //     ctx.strokeStyle = currentTheme?.grid || defaultTheme.grid;
      //     ctx.lineWidth = 0.5;
      //     ctx.setLineDash([]);
      //     ctx.beginPath();
      //     ctx.moveTo(candleCenterX, 0);
      //     ctx.lineTo(candleCenterX, dimensions.height);
      //     ctx.stroke();
      //   }
      // });

      // Update horizontal grid lines to remove boundary checks
      gridPrices.forEach((price) => {
        const y = getY(price, adjustedMinPrice, adjustedMaxPrice, chartHeight);

        // Draw grid line without boundary check
        ctx.beginPath();
        ctx.strokeStyle = currentTheme?.grid || defaultTheme.grid;
        ctx.lineWidth = 0.5;
        ctx.moveTo(dimensions.padding.left, y);
        ctx.lineTo(dimensions.width - dimensions.padding.right, y);
        ctx.stroke();

        // Draw price label
        ctx.fillStyle = currentTheme?.text || defaultTheme.text;
        ctx.textAlign = "left";
        ctx.textBaseline = "middle";
        ctx.fillText(
          price.toFixed(2),
          dimensions.width - dimensions.padding.right + 5,
          y
        );
      });

      // Draw candlesticks without boundary checks
      visibleData.forEach((candle, i) => {
        const fractionalOffset =
          viewState.startIndex - Math.floor(viewState.startIndex);
        const x = dimensions.padding.left + (i - fractionalOffset) * barWidth;
        const openY = getY(
          candle.open,
          adjustedMinPrice,
          adjustedMaxPrice,
          chartHeight
        );
        const closeY = getY(
          candle.close,
          adjustedMinPrice,
          adjustedMaxPrice,
          chartHeight
        );
        const highY = getY(
          candle.high,
          adjustedMinPrice,
          adjustedMaxPrice,
          chartHeight
        );
        const lowY = getY(
          candle.low,
          adjustedMinPrice,
          adjustedMaxPrice,
          chartHeight
        );

        const opacity = candle.display === false ? 0 : 1;

        ctx.globalAlpha = opacity;
        ctx.fillStyle =
          candle.close >= candle.open
            ? currentTheme?.upColor || defaultTheme.upColor
            : currentTheme?.downColor || defaultTheme.downColor;
        ctx.strokeStyle = ctx.fillStyle;

        // Draw wick
        ctx.beginPath();
        ctx.moveTo(x + candleWidth / 2, highY);
        ctx.lineTo(x + candleWidth / 2, lowY);
        ctx.stroke();

        // Draw candle body
        const bodyHeight = Math.max(Math.abs(closeY - openY), 1);
        ctx.fillRect(x, Math.min(openY, closeY), candleWidth, bodyHeight);
      });

      // Reset opacity
      ctx.globalAlpha = 1;

      // After drawing all candles, draw the last price line
      if (data.length > 0) {
        const lastCandle = data[data.length - 1];
        const previousCandle = data[data.length - 2];

        // Calculate line color based on previous close
        const lineColor = previousCandle
          ? lastCandle.close >= previousCandle.close
            ? "#26a69a"
            : "#ef5350"
          : "#26a69a";

        // Calculate y position using the same scale as candlesticks
        const y = getY(
          lastCandle.close,
          adjustedMinPrice,
          adjustedMaxPrice,
          chartHeight
        );

        ctx.save();
        ctx.beginPath();
        ctx.setLineDash([2, 2]); // Create dashed line effect
        ctx.strokeStyle = lineColor;
        ctx.lineWidth = 0.4;

        // Draw line from left to right of the chart
        ctx.moveTo(dimensions.padding.left, y);
        ctx.lineTo(dimensions.width - dimensions.padding.right, y);
        ctx.stroke();

        // Draw last price text
        // ctx.font = "12px Arial";
        // ctx.fillStyle = lineColor;
        // ctx.textAlign = "right";
        // ctx.fillText(
        //   lastCandle.close.toFixed(2),
        //   dimensions.width - dimensions.padding.right - 5, // 5px padding from right
        //   y - 5 // 5px above the line
        // );

        ctx.restore();
      }

      // Get current clip boundaries
      const clipBoundaries = getClipBoundaries();

      // Add clipping with extended boundaries
      ctx.save();
      ctx.beginPath();
      ctx.rect(
        dimensions.padding.left - clipBoundaries.left,
        -clipBoundaries.top,
        chartWidth + clipBoundaries.left + clipBoundaries.right,
        totalHeight + clipBoundaries.top + clipBoundaries.bottom
      );
      ctx.clip();

      // Draw elements that should be outside clipping (like axis labels)
      // ... price labels, time labels, etc.

      // Restore context to remove clipping
      ctx.restore();
    },
    [
      dimensions,
      viewState,
      combinedData,
      isRSIEnabled,
      rsiHeight,
      currentTheme,
      defaultTheme,
      calculateGridPrices,
      getY,
      getClipBoundaries,
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
        Math.min(containerHeight * 0.4, dragStartHeight + dy)
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
  const rsiContainerStyle = {
    zIndex: 3,
    position: "relative",
    height: `${rsiHeight}px`,
    borderTop: `1px solid ${currentTheme?.grid || defaultTheme.grid}`,
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
            backgroundColor: currentTheme?.grid || defaultTheme.grid,
            cursor: "ns-resize",
            position: "relative",
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
              backgroundColor: currentTheme?.text || defaultTheme.text,
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
      // Target minimum pixels between labels
      const minPixelsBetweenLabels = 80;

      // Calculate how many bars we need between labels
      const barsNeeded = Math.ceil(minPixelsBetweenLabels / barWidth);

      // Get timeframe in minutes
      const timeframeMinutes =
        timeframeConfig.interval === "1D"
          ? 1440
          : timeframeConfig.interval === "1H"
            ? 60
            : timeframeConfig.interval === "15"
              ? 15
              : timeframeConfig.interval === "5"
                ? 5
                : 1;

      // Calculate total minutes needed for spacing
      const minutesNeeded = barsNeeded * timeframeMinutes;

      // Define intervals based on timeframe
      if (timeframeConfig.interval === "1D") {
        // For daily timeframe
        const intervals = [1, 2, 3, 5, 7, 14, 30]; // Days
        const daysNeeded = Math.ceil(minutesNeeded / 1440);
        return (
          (intervals.find((i) => i >= daysNeeded) ||
            intervals[intervals.length - 1]) * 1440
        );
      } else if (timeframeConfig.interval === "1H") {
        // For hourly timeframe
        const intervals = [1, 2, 3, 4, 6, 8, 12, 24]; // Hours
        const hoursNeeded = Math.ceil(minutesNeeded / 60);
        return (
          (intervals.find((i) => i >= hoursNeeded) ||
            intervals[intervals.length - 1]) * 60
        );
      } else {
        // For minute timeframes
        const intervals = [1, 5, 15, 30, 60, 120, 240, 480]; // Minutes
        return (
          intervals.find((i) => i >= minutesNeeded) ||
          intervals[intervals.length - 1]
        );
      }
    },
    [timeframeConfig.interval]
  );

  // Helper function to format date
  const formatDate = (date: Date, showYear = false) => {
    const month = date.toLocaleString("default", { month: "short" });
    const day = date.getDate();
    const year = date.getFullYear();

    return showYear ? `${month}/${year}` : `${month}/${day}`;
  };

  // Add this helper function near the top of the component to calculate x positions
  const calculateBarX = useCallback(
    (index: number, fractionalOffset = 0) => {
      const chartWidth =
        dimensions.width - dimensions.padding.left - dimensions.padding.right;
      const barWidth = chartWidth / viewState.visibleBars;
      return (
        dimensions.padding.left +
        (index - fractionalOffset) * barWidth +
        barWidth / 2
      );
    },
    [
      dimensions.width,
      dimensions.padding.left,
      dimensions.padding.right,
      viewState.visibleBars,
    ]
  );

  // Update the drawXAxisLabels function
  const drawXAxisLabels = useCallback(
    (ctx: CanvasRenderingContext2D) => {
      const visibleData = combinedData.slice(
        Math.floor(viewState.startIndex),
        Math.ceil(viewState.startIndex + viewState.visibleBars)
      );

      const fractionalOffset =
        viewState.startIndex - Math.floor(viewState.startIndex);
      const chartWidth =
        dimensions.width - dimensions.padding.left - dimensions.padding.right;
      const barWidth = chartWidth / viewState.visibleBars;
      const labelInterval = calculateLabelInterval(barWidth);

      ctx.fillStyle = currentTheme?.text || defaultTheme.text;
      ctx.textAlign = "center";
      ctx.font = "10px sans-serif";

      let lastDate: Date | null = null;

      visibleData.forEach((candle, i) => {
        const x = calculateBarX(i, fractionalOffset);
        const date = new Date(candle.timestamp);
        const hours = date.getHours();
        const minutes = date.getMinutes();
        const totalMinutes = hours * 60 + minutes;

        const isMarketOpen = hours === 9 && minutes === 15;
        const isDayChange = hours === 0 && minutes === 0;
        const isYearChange =
          lastDate && date.getFullYear() !== lastDate.getFullYear();

        const shouldDrawLabel = (() => {
          if (isMarketOpen) return true;
          if (isDayChange) return true;
          if (isYearChange) return true;
          return totalMinutes % (labelInterval || 1) === 0;
        })();

        // Draw grid lines with smooth movement
        if (mainCanvasRef.current) {
          const mainCtx = mainCanvasRef.current.getContext("2d");
          if (mainCtx) {
            mainCtx.strokeStyle = currentTheme?.grid || defaultTheme.grid;
            mainCtx.lineWidth = 0.5;
            mainCtx.globalAlpha = 0.2;

            const shouldDrawGrid = (() => {
              const isMarketOpen = hours === 9 && minutes === 15;
              const isDayChange = hours === 0 && minutes === 0;

              if (timeframeConfig.resolution === "D") {
                return isMarketOpen || date.getDate() === 1 || isDayChange;
              } else if (timeframeConfig.resolution === "60") {
                return (
                  isMarketOpen ||
                  isDayChange ||
                  totalMinutes % (labelInterval || 60) === 0
                );
              } else {
                return (
                  isMarketOpen ||
                  isDayChange ||
                  totalMinutes % (labelInterval || 1) === 0
                );
              }
            })();

            if (shouldDrawGrid) {
              mainCtx.beginPath();
              mainCtx.moveTo(x, dimensions.padding.top);
              mainCtx.lineTo(x, dimensions.height - 30);
              mainCtx.stroke();
            }
          }
        }

        // Draw x-axis labels with smooth movement
        if (
          shouldDrawLabel &&
          x >= dimensions.padding.left &&
          x <= dimensions.width - dimensions.padding.right
        ) {
          // Draw grid line
          ctx.strokeStyle = currentTheme?.grid || defaultTheme.grid;
          ctx.lineWidth = 0.5;
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, 8);
          ctx.stroke();

          // Format time label based on condition
          let timeLabel;
          if (isMarketOpen) {
            timeLabel = `${formatDate(date)}`;
          } else if (isDayChange || isYearChange) {
            timeLabel = isYearChange
              ? formatDate(date, true)
              : formatDate(date);
          } else {
            timeLabel = date.toLocaleTimeString(undefined, {
              hour: "2-digit",
              minute: "2-digit",
              hour12: false,
            });
          }

          ctx.fillText(timeLabel, x, 20);
        }

        lastDate = date;
      });
    },
    [
      combinedData,
      dimensions,
      viewState,
      currentTheme,
      defaultTheme,
      calculateLabelInterval,
      timeframeConfig.resolution,
      calculateBarX,
    ]
  );

  // Update the drawXAxisCrosshair function
  const drawXAxisCrosshair = useCallback(() => {
    if (!xAxisCanvasRef.current || !currentTheme) return;

    const canvas = xAxisCanvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas size with device pixel ratio
    const dpr = window.devicePixelRatio || 1;
    canvas.width = dimensions.width * dpr;
    canvas.height = 30 * dpr;
    ctx.scale(dpr, dpr);

    // Clear canvas
    ctx.clearRect(0, 0, dimensions.width, 30);

    // Draw regular x-axis labels first
    drawXAxisLabels(ctx);

    // Draw crosshair label only if visible
    if (xAxisCrosshair.visible) {
      const timeLabel = timeframeConfig.tickFormat(xAxisCrosshair.timestamp);
      const timeLabelWidth = ctx.measureText(timeLabel).width + 10;
      const timeLabelHeight = 16;

      // Calculate label position to keep it within bounds
      const minX = dimensions.padding.left;
      const maxX = dimensions.width - dimensions.padding.right;
      let labelX = xAxisCrosshair.x - timeLabelWidth / 2;

      // Adjust label position if it would go outside bounds
      if (labelX < minX) {
        labelX = minX;
      } else if (labelX + timeLabelWidth > maxX) {
        labelX = maxX - timeLabelWidth;
      }

      // Draw label background
      ctx.fillStyle = currentTheme.axisBackground;
      ctx.fillRect(
        labelX,
        (30 - timeLabelHeight) / 2,
        timeLabelWidth,
        timeLabelHeight
      );

      // Draw label text
      ctx.fillStyle = currentTheme.text;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(timeLabel, labelX + timeLabelWidth / 2, 30 / 2);
    }
  }, [
    xAxisCrosshair,
    dimensions,
    timeframeConfig,
    currentTheme,
    drawXAxisLabels,
  ]);

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
    ctx.lineWidth = 1;
    ctx.strokeStyle = currentTheme?.crosshair || defaultTheme.crosshair;

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
      const priceLabel = mousePosition.price.toFixed(2);
      const priceLabelWidth = ctx.measureText(priceLabel).width + 10;
      const priceLabelHeight = 20;

      // Price label background
      ctx.fillStyle = currentTheme.axisBackground;
      ctx.fillRect(
        dimensions.width - dimensions.padding.right,
        mousePosition.y - priceLabelHeight / 2,
        priceLabelWidth,
        priceLabelHeight
      );

      // Price label text
      ctx.fillStyle = currentTheme.text;
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
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

      // Only handle double click on y-axis area
      if (x < dimensions.width - dimensions.padding.right) return;

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
        scaleY: baseScale,
        offsetY: 0, // Reset vertical offset
      };

      // Animate to new state
      animateViewState(targetState);
    },
    [
      dimensions,
      viewState,
      combinedData,
      isRSIEnabled,
      rsiHeight,
      animateViewState,
    ]
  );

  // Add this function with the other handlers
  const handleXAxisDoubleClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
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

  // Update the return JSX
  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        background: currentTheme?.background || defaultTheme.background,
        display: "flex",
        flexDirection: "column",
      }}
    >
      <ScrollToRightButton
        onClick={scrollToRight}
        theme={currentTheme || defaultTheme}
        isVisible={shouldShowScrollButton}
      />

      {/* Main container with chart, RSI, and crosshair */}
      <div style={{ position: "relative", flex: 1 }}>
        {/* Main container including chart and RSI */}
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
        >
          {/* Main Chart Canvas */}
          <div
            style={{
              height: `${dimensions.height - (isRSIEnabled ? rsiHeight + 34 : 30)}px`,
            }}
          >
            <canvas
              ref={mainCanvasRef}
              style={{
                width: "100%",
                height: "100%",
                position: "absolute",
                zIndex: 1,
              }}
            />
          </div>

          {/* RSI Section */}
          {isRSIEnabled && (
            <>
              {/* RSI Dragger */}
              <div
                style={{
                  height: "4px",
                  backgroundColor: currentTheme?.grid || defaultTheme.grid,
                  cursor: "ns-resize",
                  position: "relative",
                  zIndex: 2,
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
                    backgroundColor: currentTheme?.text || defaultTheme.text,
                    opacity: isDraggingRSI ? 0.8 : 0.5, // Increase opacity while dragging
                    transition: "opacity 0.2s ease",
                  }}
                />
              </div>

              {/* RSI Chart */}
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
        </div>

        {/* Crosshair Overlay - Covers entire chart area */}
        <canvas
          ref={overlayCanvasRef}
          style={{
            width: "100%",
            height: "100%",
            position: "absolute",
            top: 0,
            left: 0,
            zIndex: 3,
            pointerEvents: "none",
          }}
        />
      </div>

      {/* X-Axis Area */}
      <div
        style={{
          height: "30px",
          borderTop: `1px solid ${currentTheme?.grid || defaultTheme.grid}`,
          position: "relative",
        }}
      >
        <canvas
          ref={xAxisCanvasRef}
          style={{
            width: "100%",
            height: "30px",
            position: "absolute",
            top: 0,
            left: 0,
            pointerEvents: "auto", // Changed from 'none' to 'auto'
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
    </div>
  );
};

// Action Button Component
const ActionButton: React.FC<{
  onClick: () => void;
  title: string;
  icon: React.ReactNode;
}> = ({ onClick, title, icon }) => {
  const { theme } = useTheme();
  const defaultTheme: ChartTheme = themes.dark!;
  const currentTheme: ChartTheme =
    themes[theme as keyof typeof themes] || defaultTheme;

  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      title={title}
      style={{
        background: "transparent",
        border: "none",
        color: currentTheme.text || defaultTheme.text,
        padding: "6px",
        borderRadius: "4px",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: "28px",
        height: "28px",
        transition: "background-color 0.2s ease",
      }}
      onMouseEnter={(e: React.MouseEvent<HTMLButtonElement>) => {
        e.currentTarget.style.backgroundColor =
          currentTheme.buttonHover || defaultTheme.buttonHover;
      }}
      onMouseLeave={(e: React.MouseEvent<HTMLButtonElement>) => {
        e.currentTarget.style.backgroundColor = "transparent";
      }}
    >
      {icon}
    </button>
  );
};

export default CanvasChart;
