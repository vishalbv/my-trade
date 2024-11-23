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
import { v4 as uuidv4 } from "uuid";
import { Drawing, DrawingState, Point, TrendLine } from "./types/drawings";
import { DrawingTool } from "./components/DrawingToolbar";

interface CanvasChartProps {
  data: OHLCData[];
  timeframeConfig: TimeframeConfig;
  indicators: Indicator[];
  activeTool: DrawingTool;
}

interface MousePosition {
  x: number;
  y: number;
  price: number;
  timestamp: number;
  visible: boolean;
}

const ANIMATION_DURATION = 300; // ms

interface ViewState {
  scale: number;
  offsetX: number;
  offsetY: number;
  startIndex: number;
  visibleBars: number;
  theme: ChartTheme;
}

const CanvasChart: React.FC<CanvasChartProps> = ({
  data,
  timeframeConfig,
  indicators,
  activeTool,
}) => {
  const mainCanvasRef = useRef<HTMLCanvasElement>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { theme } = useTheme();
  const currentTheme = themes[theme as keyof typeof themes] || themes.dark;

  const [dimensions, setDimensions] = useState<ChartDimensions>({
    width: 0,
    height: 0,
    padding: { top: 20, right: 60, bottom: 30, left: 10 },
  });

  const [viewState, setViewState] = useState<ViewState>({
    scale: 1,
    offsetX: 0,
    offsetY: 0,
    startIndex: 0,
    visibleBars: 0,
    theme: themes.dark,
  });

  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

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

  const [rsiHeight, setRsiHeight] = useState(100);
  const [isDraggingDivider, setIsDraggingDivider] = useState(false);

  const [dragStartHeight, setDragStartHeight] = useState<number>(100);
  const [dragStartY, setDragStartY] = useState<number>(0);
  const lastDragUpdate = useRef<number>(0);
  const isRSIEnabled = indicators.find((i) => i.id === "rsi")?.enabled || false;

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
          scale:
            animation.startState.scale +
            (animation.targetState.scale - animation.startState.scale) * eased,
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
          (hours === 15 && minutes > 30)
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

  // Combine real and dummy data
  const combinedData = useMemo(() => {
    if (!data.length) return [];

    // Calculate number of dummy candles (90% of chart width)
    const chartWidth =
      dimensions.width - dimensions.padding.left - dimensions.padding.right;
    const candleWidth = 10; // Base candle width
    const totalPossibleCandles = Math.floor(chartWidth / candleWidth);
    const dummyCount = Math.floor(totalPossibleCandles * 0.9);

    const dummyCandles = createDummyCandles(data[data.length - 1], dummyCount);
    return [...data, ...dummyCandles];
  }, [data, dimensions, createDummyCandles]);

  // Update initialization effect
  useEffect(() => {
    if (!dimensions.width || !combinedData.length) return;

    // Only set initial view state if it hasn't been set before
    if (viewState.visibleBars === 0) {
      const chartWidth =
        dimensions.width - dimensions.padding.left - dimensions.padding.right;
      const initialVisibleBars = Math.floor(chartWidth / 10);
      const totalDummyCandles = combinedData.length - data.length;
      const visibleDummyCandles = Math.floor(initialVisibleBars * 0.2);
      const startIndex = Math.max(
        0,
        data.length - (initialVisibleBars - visibleDummyCandles)
      );

      setViewState({
        scale: 1,
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

  // Mouse event handlers
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;

    if (
      x >= dimensions.padding.left &&
      x <= dimensions.width - dimensions.padding.right
    ) {
      setIsDragging(true);
      setDragStart({ x: e.clientX, y: e.clientY });
      (e.currentTarget as HTMLDivElement).style.cursor = "grabbing";
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    // Always update crosshair first
    handleMouseMoveForCrosshair(e);

    if (!isDragging) return;

    // Calculate horizontal movement
    const dx = e.clientX - dragStart.x;
    const chartWidth =
      dimensions.width - dimensions.padding.left - dimensions.padding.right;
    const barWidth = chartWidth / viewState.visibleBars;
    const barsToMove = Math.round(dx / barWidth);

    // Calculate vertical movement
    const dy = e.clientY - dragStart.y;
    const chartHeight =
      dimensions.height - dimensions.padding.top - dimensions.padding.bottom;

    // Get visible data for price calculations
    const visibleData = combinedData.slice(
      viewState.startIndex,
      viewState.startIndex + viewState.visibleBars
    );
    const prices = visibleData.flatMap((candle) => [candle.high, candle.low]);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const priceRange = maxPrice - minPrice;

    // Calculate price movement based on vertical drag
    const priceMove = (dy / chartHeight) * priceRange;

    if (barsToMove !== 0 || Math.abs(dy) > 1) {
      // Update view state with new start index and offset
      setViewState((prev) => {
        const newStartIndex = Math.max(
          0,
          Math.min(
            combinedData.length - prev.visibleBars,
            prev.startIndex - barsToMove
          )
        );

        // Update vertical offset
        const newOffsetY = (prev.offsetY || 0) + priceMove;

        // Limit vertical panning to reasonable bounds
        const maxOffset = priceRange * 0.5;
        const boundedOffsetY = Math.max(
          -maxOffset,
          Math.min(maxOffset, newOffsetY)
        );

        return {
          ...prev,
          startIndex: newStartIndex,
          offsetY: boundedOffsetY,
        };
      });

      // Update drag start position
      setDragStart({ x: e.clientX, y: e.clientY });
    }
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLDivElement>) => {
    setIsDragging(false);
    (e.currentTarget as HTMLDivElement).style.cursor = "crosshair";
  };

  const handleMouseLeave = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isDragging) {
      setIsDragging(false);
      (e.currentTarget as HTMLDivElement).style.cursor = "crosshair";
    }
    setMousePosition((prev) => ({ ...prev, visible: false }));

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
      const visibleBars = Math.floor(chartWidth / (10 * viewState.scale));

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
    (zoomFactor: number, centerX?: number) => {
      if (!combinedData.length || !dimensions.width) return;

      const newScale = Math.max(0.1, Math.min(5, viewState.scale * zoomFactor));
      const newVisibleBars = Math.floor(
        (dimensions.width -
          dimensions.padding.left -
          dimensions.padding.right) /
          (10 * newScale)
      );

      let newStartIndex;
      if (centerX !== undefined) {
        const chartX = centerX - dimensions.padding.left;
        const mouseBarPosition = chartX / (10 * viewState.scale);
        const barOffset =
          mouseBarPosition - mouseBarPosition * (newScale / viewState.scale);
        newStartIndex = Math.max(
          0,
          Math.min(
            combinedData.length - newVisibleBars,
            viewState.startIndex + Math.floor(barOffset)
          )
        );
      } else {
        const centerIndex = viewState.startIndex + viewState.visibleBars / 2;
        newStartIndex = Math.max(
          0,
          Math.min(
            combinedData.length - newVisibleBars,
            centerIndex - newVisibleBars / 2
          )
        );
      }

      animateViewState({
        scale: newScale,
        offsetX: viewState.offsetX,
        offsetY: viewState.offsetY,
        startIndex: newStartIndex,
        visibleBars: newVisibleBars,
        theme: currentTheme || themes.dark,
      });
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
  const [touchState, setTouchState] = useState<{
    startTouches?: Touch[];
    startDistance?: number;
    startScale?: number;
  }>({});

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
        startScale: viewState.scale,
      });
    } else if (e.touches.length === 1 && e.touches[0]) {
      setIsDragging(true);
      setDragStart({ x: e.touches[0].clientX, y: e.touches[0].clientY });
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
      handleZoom((scale / viewState.scale) * touchState.startScale);
    } else if (e.touches.length === 1 && e.touches[0] && isDragging) {
      const dx = e.touches[0].clientX - dragStart.x;
      const barsToMove = Math.floor(dx / (10 * viewState.scale));
      handlePan(-barsToMove);
      setDragStart({ x: e.touches[0].clientX, y: e.touches[0].clientY });
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
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

      // Calculate new scale with bounds
      const newScale = Math.max(0.1, Math.min(5, viewState.scale * zoomFactor));
      const newVisibleBars = Math.floor(
        (dimensions.width -
          dimensions.padding.left -
          dimensions.padding.right) /
          (10 * newScale)
      );

      // Calculate new start index based on mouse position
      const chartX = mouseX - dimensions.padding.left;
      const mouseBarPosition = chartX / (10 * viewState.scale);
      const barOffset =
        mouseBarPosition - mouseBarPosition * (newScale / viewState.scale);

      const newStartIndex = Math.max(
        0,
        Math.min(
          combinedData.length - newVisibleBars,
          viewState.startIndex + Math.floor(barOffset)
        )
      );

      // Update view state with animation
      animateViewState({
        scale: newScale,
        offsetX: viewState.offsetX,
        offsetY: viewState.offsetY,
        startIndex: newStartIndex,
        visibleBars: newVisibleBars,
        theme: viewState.theme, // Use the current theme from viewState
      });
    },
    [viewState, dimensions, combinedData.length, animateViewState]
  );

  // Add the missing double click handler
  const handleDoubleClick = () => {
    resetView();
  };

  // Update the drawCrosshair function
  const drawCrosshair = useCallback(() => {
    if (!overlayCanvasRef.current || !mousePosition.visible) return;

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
    ctx.strokeStyle = currentTheme.crosshair;

    // Draw vertical line (extend through RSI)
    ctx.beginPath();
    ctx.moveTo(mousePosition.x, dimensions.padding.top);
    ctx.lineTo(mousePosition.x, dimensions.height - 30); // Extend to bottom, leaving space for x-axis
    ctx.stroke();

    // Draw horizontal line (only in main chart area)
    if (mousePosition.y <= dimensions.height - 130) {
      // Only draw if in main chart area
      ctx.beginPath();
      ctx.moveTo(dimensions.padding.left, mousePosition.y);
      ctx.lineTo(dimensions.width - dimensions.padding.right, mousePosition.y);
      ctx.stroke();
    }

    // Reset dash pattern
    ctx.setLineDash([]);

    // Draw price label (only if in main chart area)
    if (mousePosition.y <= dimensions.height - 130) {
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

    // Draw time label at bottom
    const timeLabel = timeframeConfig.tickFormat(mousePosition.timestamp);
    const timeLabelWidth = ctx.measureText(timeLabel).width + 10;
    const timeLabelHeight = 20;

    // Time label background
    ctx.fillStyle = currentTheme.axisBackground;
    ctx.fillRect(
      mousePosition.x - timeLabelWidth / 2,
      dimensions.height - 25, // Position above x-axis
      timeLabelWidth,
      timeLabelHeight
    );

    // Time label text
    ctx.fillStyle = currentTheme.text;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(
      timeLabel,
      mousePosition.x,
      dimensions.height - 15 // Center in label area
    );
  }, [mousePosition, dimensions, timeframeConfig, currentTheme]);

  // Update mouse position handler
  const handleMouseMoveForCrosshair = useCallback(
    (e: React.MouseEvent) => {
      if (!overlayCanvasRef.current || !data.length) return;

      const canvas = overlayCanvasRef.current;
      const rect = canvas.getBoundingClientRect();

      // Calculate the scaling factor between CSS pixels and canvas pixels
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;

      // Get mouse position in CSS pixels relative to canvas
      const cssX = e.clientX - rect.left;
      const cssY = e.clientY - rect.top;

      // Convert to canvas pixels
      const displayX = (cssX * scaleX) / (window.devicePixelRatio || 1);
      const displayY = (cssY * scaleY) / (window.devicePixelRatio || 1);

      // Check if mouse is within chart area
      if (
        displayX >= dimensions.padding.left &&
        displayX <= dimensions.width - dimensions.padding.right &&
        displayY >= dimensions.padding.top &&
        displayY <= dimensions.height - dimensions.padding.bottom
      ) {
        // Calculate bar index and center
        const chartWidth =
          dimensions.width - dimensions.padding.left - dimensions.padding.right;
        const barWidth = chartWidth / viewState.visibleBars;
        const mouseX = displayX - dimensions.padding.left;
        const barIndex = Math.floor(mouseX / barWidth);
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

        // Calculate price from y position
        const prices = visibleData.flatMap((candle) => [
          candle.high,
          candle.low,
        ]);
        const minPrice = Math.min(...prices);
        const maxPrice = Math.max(...prices);
        const priceRange = maxPrice - minPrice;
        const pricePadding = priceRange * 0.1;

        const adjustedMinPrice = minPrice - pricePadding + viewState.offsetY;
        const adjustedMaxPrice = maxPrice + pricePadding + viewState.offsetY;
        const adjustedPriceRange = adjustedMaxPrice - adjustedMinPrice;

        const price =
          adjustedMaxPrice -
          ((displayY - dimensions.padding.top) /
            (dimensions.height -
              dimensions.padding.top -
              dimensions.padding.bottom)) *
            adjustedPriceRange;

        // Get timestamp from the exact candle
        const candle = visibleData[barIndex];
        const timestamp = candle ? candle.timestamp : 0;

        setMousePosition({
          x: barCenterX,
          y: displayY,
          price,
          timestamp,
          visible: true,
        });
      } else {
        setMousePosition((prev) => ({ ...prev, visible: false }));
      }
    },
    [dimensions, data, viewState, combinedData]
  );

  // Add effect to draw crosshair
  useEffect(() => {
    drawCrosshair();
  }, [drawCrosshair]);

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
      const prevWidth = ctx.measureText(prevLabel.text).width;
      const spacing = currentLabel.x - (prevLabel.x + prevWidth);
      if (spacing < minSpacing) return true;
    }
    return false;
  };

  // Add this before calculateGridPrices
  const getY = (
    price: number,
    minPrice: number,
    maxPrice: number,
    chartHeight: number
  ): number => {
    const priceRange = maxPrice - minPrice;
    if (priceRange === 0) return dimensions.padding.top;

    const percentage = (maxPrice - price) / priceRange;
    return dimensions.padding.top + percentage * chartHeight;
  };

  // Add this function to calculate grid prices
  const calculateGridPrices = (
    minPrice: number,
    maxPrice: number,
    adjustedMinPrice: number,
    adjustedMaxPrice: number,
    chartHeight: number,
    maxTicks: number = 6
  ): { gridPrices: number[]; priceLabels: { y: number; text: string }[] } => {
    const visiblePriceRange = adjustedMaxPrice - adjustedMinPrice;
    const gridPriceStep = calculateNiceNumber(visiblePriceRange, maxTicks);

    // Calculate grid prices
    const firstGridPrice =
      Math.ceil(adjustedMinPrice / gridPriceStep) * gridPriceStep;
    const gridPrices: number[] = [];
    const priceLabels: { y: number; text: string }[] = [];

    for (
      let price = firstGridPrice;
      price <= adjustedMaxPrice;
      price += gridPriceStep
    ) {
      gridPrices.push(price);
      const y = getY(price, adjustedMinPrice, adjustedMaxPrice, chartHeight);
      priceLabels.push({
        y,
        text: price.toFixed(2),
      });
    }

    return { gridPrices, priceLabels };
  };

  // Update the handleDividerMouseDown function
  const handleDividerMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDraggingDivider(true);
    setDragStartHeight(rsiHeight);
    setDragStartY(e.clientY);
  };

  // Update the divider dragging effect
  useEffect(() => {
    const handleDividerDrag = (e: MouseEvent) => {
      if (!isDraggingDivider || !containerRef.current) return;

      // Throttle updates to every 16ms (roughly 60fps)
      const now = performance.now();
      if (now - lastDragUpdate.current < 16) return;
      lastDragUpdate.current = now;

      const deltaY = e.clientY - dragStartY;
      const containerRect = containerRef.current.getBoundingClientRect();
      const totalHeight = containerRect.height;

      // Calculate new height based on the initial height and mouse movement
      const minHeight = 50;
      const maxHeight = Math.min(300, totalHeight * 0.4);
      const newHeight = Math.max(
        minHeight,
        Math.min(maxHeight, dragStartHeight - deltaY)
      );

      // Use RAF for smooth updates
      requestAnimationFrame(() => {
        setRsiHeight(Math.round(newHeight)); // Round to avoid sub-pixel rendering
      });
    };

    const handleDividerDragEnd = () => {
      setIsDraggingDivider(false);
    };

    if (isDraggingDivider) {
      window.addEventListener("mousemove", handleDividerDrag, {
        passive: true,
      });
      window.addEventListener("mouseup", handleDividerDragEnd);

      // Prevent text selection while dragging
      document.body.style.userSelect = "none";
      document.body.style.cursor = "row-resize";
    }

    return () => {
      window.removeEventListener("mousemove", handleDividerDrag);
      window.removeEventListener("mouseup", handleDividerDragEnd);

      // Reset styles
      document.body.style.userSelect = "";
      document.body.style.cursor = "";
    };
  }, [isDraggingDivider, dragStartHeight, dragStartY]);

  // Update the divider JSX
  {
    isRSIEnabled && (
      <>
        {/* Draggable Divider */}
        <div
          style={{
            height: "4px",
            background: currentTheme.grid,
            cursor: "row-resize",
            position: "relative",
            userSelect: "none",
            touchAction: "none",
            opacity: isDraggingDivider ? 0.8 : 0.5, // Visual feedback
            transition: "opacity 0.2s ease", // Smooth opacity change
          }}
          onMouseDown={handleDividerMouseDown}
        >
          {/* Drag handle indicator */}
          <div
            style={{
              position: "absolute",
              left: "50%",
              top: "50%",
              transform: "translate(-50%, -50%)",
              width: "30px",
              height: "2px",
              background: currentTheme.text,
              borderRadius: "1px",
              opacity: isDraggingDivider ? 1 : 0.7,
              transition: "opacity 0.2s ease",
            }}
          />
          {/* Add side handles for better visual feedback */}
          <div
            style={{
              position: "absolute",
              left: "calc(50% - 20px)",
              top: "50%",
              transform: "translateY(-50%)",
              width: "4px",
              height: "8px",
              background: currentTheme.text,
              borderRadius: "2px",
              opacity: isDraggingDivider ? 1 : 0.7,
            }}
          />
          <div
            style={{
              position: "absolute",
              right: "calc(50% - 20px)",
              top: "50%",
              transform: "translateY(-50%)",
              width: "4px",
              height: "8px",
              background: currentTheme.text,
              borderRadius: "2px",
              opacity: isDraggingDivider ? 1 : 0.7,
            }}
          />
        </div>

        {/* RSI Container with smooth height transition */}
        <div
          style={{
            height: `${rsiHeight}px`,
            position: "relative",
            transition: isDraggingDivider ? "none" : "height 0.2s ease",
          }}
        >
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
    );
  }

  // Add drawing state
  const [drawingState, setDrawingState] = useState<DrawingState>({
    drawings: [],
    activeDrawing: null,
    isDrawing: false,
    isDragging: false,
    dragPoint: null,
    startPoint: null,
  });

  // Function to convert mouse coordinates to chart coordinates
  const getChartCoordinates = (e: React.MouseEvent): Point => {
    if (!overlayCanvasRef.current) return { x: 0, y: 0 };
    const rect = overlayCanvasRef.current.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  // Function to check if a point is near a line
  const isNearLine = (
    point: Point,
    start: Point,
    end: Point,
    threshold = 5
  ): boolean => {
    const A = point.x - start.x;
    const B = point.y - start.y;
    const C = end.x - start.x;
    const D = end.y - start.y;

    const dot = A * C + B * D;
    const lenSq = C * C + D * D;
    let param = -1;

    if (lenSq !== 0) param = dot / lenSq;

    let xx, yy;

    if (param < 0) {
      xx = start.x;
      yy = start.y;
    } else if (param > 1) {
      xx = end.x;
      yy = end.y;
    } else {
      xx = start.x + param * C;
      yy = start.y + param * D;
    }

    const dx = point.x - xx;
    const dy = point.y - yy;

    return Math.sqrt(dx * dx + dy * dy) < threshold;
  };

  // Function to check if a point is near another point
  const isNearPoint = (p1: Point, p2: Point, threshold = 5): boolean => {
    const dx = p1.x - p2.x;
    const dy = p1.y - p2.y;
    return Math.sqrt(dx * dx + dy * dy) < threshold;
  };

  // Handle mouse down for drawing
  const handleDrawingMouseDown = (e: React.MouseEvent) => {
    if (activeTool !== "trendLine") return;

    const point = getChartCoordinates(e);

    // If we're not currently drawing, start a new line
    if (!drawingState.isDrawing) {
      setDrawingState((prev) => ({
        ...prev,
        isDrawing: true,
        startPoint: point,
        activeDrawing: {
          id: uuidv4(),
          type: "trendLine",
          startPoint: point,
          endPoint: point,
        },
      }));
    } else {
      // If we are drawing, finish the line on second click
      setDrawingState((prev) => ({
        ...prev,
        isDrawing: false,
        startPoint: null,
        drawings: [...prev.drawings, prev.activeDrawing!],
        activeDrawing: null,
      }));
    }
  };

  // Handle mouse move for drawing
  const handleDrawingMouseMove = (e: React.MouseEvent) => {
    if (drawingState.isDrawing && drawingState.activeDrawing) {
      // Update the end point while drawing
      const point = getChartCoordinates(e);
      setDrawingState((prev) => ({
        ...prev,
        activeDrawing: {
          ...prev.activeDrawing!,
          endPoint: point,
        },
      }));
    }
  };

  // Handle mouse up for drawing
  const handleDrawingMouseUp = () => {
    if (drawingState.isDrawing || drawingState.isDragging) {
      setDrawingState((prev) => {
        const newDrawings = prev.isDragging
          ? prev.drawings.map((d) =>
              d.id === prev.activeDrawing?.id ? prev.activeDrawing : d
            )
          : [...prev.drawings, prev.activeDrawing!];

        return {
          drawings: newDrawings,
          activeDrawing: null,
          isDrawing: false,
          isDragging: false,
          dragPoint: null,
          startPoint: null,
        };
      });
    }
  };

  // Add drawing event handlers to the overlay canvas
  useEffect(() => {
    const canvas = overlayCanvasRef.current;
    if (!canvas) return;

    canvas.style.cursor = activeTool === "trendLine" ? "crosshair" : "default";
  }, [activeTool]);

  // Draw the trend lines
  const drawTrendLines = useCallback(
    (ctx: CanvasRenderingContext2D) => {
      const drawLine = (line: TrendLine, isActive: boolean) => {
        ctx.beginPath();
        ctx.moveTo(line.startPoint.x, line.startPoint.y);
        ctx.lineTo(line.endPoint.x, line.endPoint.y);
        ctx.strokeStyle = isActive ? currentTheme.text : currentTheme.grid;
        ctx.lineWidth = isActive ? 2 : 1;
        ctx.stroke();

        // Draw end points
        [line.startPoint, line.endPoint].forEach((point) => {
          ctx.beginPath();
          ctx.arc(point.x, point.y, 4, 0, Math.PI * 2);
          ctx.fillStyle = isActive ? currentTheme.text : currentTheme.grid;
          ctx.fill();
        });
      };

      // Draw all lines
      drawingState.drawings.forEach((drawing) => {
        if (drawing.type === "trendLine") {
          drawLine(drawing, drawing === drawingState.activeDrawing);
        }
      });

      // Draw active drawing
      if (drawingState.activeDrawing?.type === "trendLine") {
        drawLine(drawingState.activeDrawing, true);
      }
    },
    [drawingState, currentTheme]
  );

  // Add xAxisCanvasRef
  const xAxisCanvasRef = useRef<HTMLCanvasElement>(null);

  // Add a separate function for drawing candlesticks
  const drawCandlesticks = (ctx: CanvasRenderingContext2D) => {
    // Calculate chart dimensions
    const chartWidth =
      dimensions.width - dimensions.padding.left - dimensions.padding.right;
    const chartHeight =
      dimensions.height - dimensions.padding.top - dimensions.padding.bottom;

    // Calculate candle dimensions
    const barSpacing = chartWidth / viewState.visibleBars;
    const candleWidth = barSpacing * 0.8;
    const spacing = barSpacing * 0.2;

    // Get visible data
    const visibleStartIndex = Math.max(0, viewState.startIndex);
    const visibleEndIndex = Math.min(
      combinedData.length,
      visibleStartIndex + viewState.visibleBars
    );
    const visibleData = combinedData.slice(visibleStartIndex, visibleEndIndex);

    if (!visibleData.length) return;

    // Calculate price range from visible data
    const prices = visibleData.flatMap((candle) => [candle.high, candle.low]);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const priceRange = maxPrice - minPrice;
    const pricePadding = priceRange * 0.1;

    // Calculate adjusted price range with offset
    const adjustedMinPrice = minPrice - pricePadding + viewState.offsetY;
    const adjustedMaxPrice = maxPrice + pricePadding + viewState.offsetY;
    const adjustedPriceRange = adjustedMaxPrice - adjustedMinPrice;

    // Draw candlesticks
    visibleData.forEach((candle, i) => {
      const x = dimensions.padding.left + i * barSpacing;
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

      // Set colors and opacity based on candle type
      const opacity = candle.display === false ? 0 : 1;

      ctx.globalAlpha = opacity;
      ctx.fillStyle =
        candle.close >= candle.open
          ? currentTheme.upColor
          : currentTheme.downColor;
      ctx.strokeStyle =
        candle.close >= candle.open
          ? currentTheme.upColor
          : currentTheme.downColor;

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
  };

  // Update the drawAxes function
  const drawAxes = (ctx: CanvasRenderingContext2D) => {
    // Calculate chart dimensions
    const chartWidth =
      dimensions.width - dimensions.padding.left - dimensions.padding.right;
    const chartHeight =
      dimensions.height - dimensions.padding.top - dimensions.padding.bottom;

    // Get visible data
    const visibleStartIndex = Math.max(0, viewState.startIndex);
    const visibleEndIndex = Math.min(
      combinedData.length,
      visibleStartIndex + viewState.visibleBars
    );
    const visibleData = combinedData.slice(visibleStartIndex, visibleEndIndex);

    if (!visibleData.length) return;

    // Calculate price range from visible data
    const prices = visibleData.flatMap((candle) => [candle.high, candle.low]);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const priceRange = maxPrice - minPrice;
    const pricePadding = priceRange * 0.1;

    // Calculate adjusted price range with offset
    const adjustedMinPrice = minPrice - pricePadding + viewState.offsetY;
    const adjustedMaxPrice = maxPrice + pricePadding + viewState.offsetY;

    // Draw price grid and labels
    const { gridPrices, priceLabels } = calculateGridPrices(
      minPrice,
      maxPrice,
      adjustedMinPrice,
      adjustedMaxPrice,
      chartHeight
    );

    // Draw grid lines
    gridPrices.forEach((price) => {
      const y = getY(price, adjustedMinPrice, adjustedMaxPrice, chartHeight);
      if (
        y >= dimensions.padding.top &&
        y <= dimensions.height - dimensions.padding.bottom
      ) {
        ctx.strokeStyle = currentTheme?.grid || themes.dark.grid;
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.moveTo(dimensions.padding.left, y);
        ctx.lineTo(dimensions.width - dimensions.padding.right, y);
        ctx.stroke();
      }
    });

    // Draw price labels
    priceLabels.forEach((label) => {
      ctx.fillStyle = currentTheme?.text || themes.dark.text;
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      ctx.fillText(
        label.text,
        dimensions.width - dimensions.padding.right + 5,
        label.y
      );
    });
  };

  // In the main render effect, update it to include both candles and drawings:

  useEffect(() => {
    if (!mainCanvasRef.current || !data.length) return;

    const mainCanvas = mainCanvasRef.current;
    const ctx = mainCanvas.getContext("2d");
    if (!ctx) return;

    // Set canvas size with device pixel ratio
    const dpr = window.devicePixelRatio || 1;
    mainCanvas.width = dimensions.width * dpr;
    mainCanvas.height = dimensions.height * dpr;
    ctx.scale(dpr, dpr);

    // Clear canvas
    ctx.clearRect(0, 0, dimensions.width, dimensions.height);

    // Draw candlesticks and axes
    drawCandlesticks(ctx);
    drawAxes(ctx);

    // Draw trend lines on overlay canvas
    const overlayCtx = overlayCanvasRef.current?.getContext("2d");
    if (overlayCtx) {
      overlayCtx.clearRect(0, 0, dimensions.width, dimensions.height);

      // Draw crosshair if not in drawing mode
      if (!activeTool) {
        drawCrosshair();
      }

      // Draw trend lines
      drawTrendLines(overlayCtx);
    }
  }, [
    dimensions,
    data,
    viewState,
    mousePosition,
    drawingState,
    drawTrendLines,
    activeTool,
  ]);

  // Add handleDrawingMouseLeave
  const handleDrawingMouseLeave = () => {
    if (drawingState.isDrawing) {
      // Cancel drawing if mouse leaves the chart area
      setDrawingState((prev) => ({
        ...prev,
        isDrawing: false,
        startPoint: null,
        activeDrawing: null,
      }));
    }
  };

  return (
    <div
      ref={containerRef}
      style={{
        position: "relative",
        width: "100%",
        height: `calc(100% - ${isRSIEnabled ? rsiHeight + 30 : 30}px)`,
        cursor:
          activeTool === "trendLine"
            ? "crosshair"
            : isDragging
              ? "grabbing"
              : "default",
        touchAction: "none",
      }}
      onMouseDown={
        activeTool === "trendLine" ? handleDrawingMouseDown : handleMouseDown
      }
      onMouseMove={
        activeTool === "trendLine" ? handleDrawingMouseMove : handleMouseMove
      }
      onMouseUp={handleMouseUp}
      onMouseLeave={(e) => {
        handleMouseLeave(e);
        handleDrawingMouseLeave();
      }}
      onWheel={handleWheel}
      onDoubleClick={handleDoubleClick}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
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
      <canvas
        ref={overlayCanvasRef}
        style={{
          width: "100%",
          height: "100%",
          position: "absolute",
          zIndex: 2,
          pointerEvents: "none",
        }}
      />
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
  const currentTheme = themes[theme as keyof typeof themes] || themes.dark;

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
        color: currentTheme.text,
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
        e.currentTarget.style.backgroundColor = currentTheme.buttonHover;
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
