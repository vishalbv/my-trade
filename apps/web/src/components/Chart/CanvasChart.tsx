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

const ANIMATION_DURATION = 300; // ms

// Add this interface for drag mode
interface DragState {
  mode: "pan" | "scaleX" | "scaleY";
  startX: number;
  startY: number;
  startScaleX: number;
  startScaleY: number;
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
        // Calculate horizontal movement with scale-based sensitivity
        const dx = e.clientX - dragState.startX;
        const chartWidth =
          dimensions.width - dimensions.padding.left - dimensions.padding.right;
        const barWidth = chartWidth / viewState.visibleBars;

        // Adjust horizontal movement speed based on scale
        const horizontalSensitivity = 1 / Math.max(0.2, viewState.scaleX);
        const barsToMove = Math.round((dx * horizontalSensitivity) / barWidth);

        // Calculate vertical movement with scale-based sensitivity
        const dy = e.clientY - dragState.startY;
        const chartHeight =
          dimensions.height -
          dimensions.padding.top -
          dimensions.padding.bottom;

        // Get visible data for price calculations
        const visibleData = combinedData.slice(
          viewState.startIndex,
          viewState.startIndex + viewState.visibleBars
        );
        const prices = visibleData.flatMap((candle) => [
          candle.high,
          candle.low,
        ]);
        const minPrice = Math.min(...prices);
        const maxPrice = Math.max(...prices);
        const priceRange = maxPrice - minPrice;

        // Adjust vertical movement speed based on scale
        const verticalSensitivity = 1 / Math.max(0.2, viewState.scaleY);
        const priceMove =
          ((dy * verticalSensitivity) / chartHeight) * priceRange;

        if (barsToMove !== 0 || Math.abs(dy) > 1) {
          setViewState((prev) => {
            const newStartIndex = Math.max(
              0,
              Math.min(
                combinedData.length - prev.visibleBars,
                prev.startIndex - barsToMove
              )
            );

            // Update vertical offset with increased range and sensitivity
            const newOffsetY = (prev.offsetY || 0) + priceMove;

            // Increase the offset limit based on scale
            const maxOffset = priceRange * (2.5 / Math.max(0.2, prev.scaleY));
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
          setDragState({
            ...dragState,
            startX: e.clientX,
            startY: e.clientY,
          });
        }
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

  // Update the drawCrosshair function
  const drawCrosshair = useCallback(() => {
    if (!overlayCanvasRef.current || !mousePosition.visible || !currentTheme)
      return;

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
  }, [mousePosition, dimensions, timeframeConfig, currentTheme, defaultTheme]);

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
      const adjustedPriceRange =
        (adjustedMaxPrice - adjustedMinPrice) / viewState.scaleY;
      return (
        dimensions.padding.top +
        chartHeight -
        ((price - adjustedMinPrice) / adjustedPriceRange) * chartHeight
      );
    },
    [dimensions.padding.top, viewState.scaleY]
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
      // Calculate nice grid step
      const visiblePriceRange = adjustedMaxPrice - adjustedMinPrice;
      const maxPriceTicks = Math.max(4, Math.floor(chartHeight / 80));
      const gridPriceStep = calculateNiceNumber(
        visiblePriceRange,
        maxPriceTicks
      );

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
        const y = getYFunc(
          price,
          adjustedMinPrice,
          adjustedMaxPrice,
          chartHeight
        );
        priceLabels.push({
          y,
          text: price.toFixed(2),
        });
      }

      return { gridPrices, priceLabels };
    },
    []
  );

  // Update the state declarations
  const [rsiHeight, setRsiHeight] = useState<number>(100);
  const [isDraggingRSI, setIsDraggingRSI] = useState(false);
  const [dragStartY, setDragStartY] = useState<number>(0);
  const [dragStartHeight, setDragStartHeight] = useState<number>(0);

  // Update the RSI separator mouse down handler
  const handleRSISeparatorMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDraggingRSI(true);
    setDragStartY(e.clientY);
    setDragStartHeight(rsiHeight);
  };

  // First declare drawChart
  const drawChart = useCallback(
    (ctx: CanvasRenderingContext2D) => {
      // Clear canvas
      ctx.clearRect(0, 0, dimensions.width, dimensions.height);

      // Calculate chart dimensions
      const chartWidth =
        dimensions.width - dimensions.padding.left - dimensions.padding.right;
      const chartHeight =
        dimensions.height -
        dimensions.padding.top -
        dimensions.padding.bottom -
        (isRSIEnabled ? rsiHeight + 4 : 0); // Add 4px for separator

      // Calculate candle dimensions using scaleX
      const barWidth = BASE_CANDLE_WIDTH * viewState.scaleX;
      const candleWidth = barWidth * 0.8;

      // Get visible data
      const visibleStartIndex = Math.max(0, viewState.startIndex);
      const visibleEndIndex = Math.min(
        combinedData.length,
        visibleStartIndex + viewState.visibleBars
      );
      const visibleData = combinedData.slice(
        visibleStartIndex,
        visibleEndIndex
      );

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

      // Calculate grid prices and labels
      const { gridPrices, priceLabels } = calculateGridPrices(
        minPrice,
        maxPrice,
        adjustedMinPrice,
        adjustedMaxPrice,
        chartHeight,
        getY
      );

      // Draw grid lines
      gridPrices.forEach((price) => {
        const y = getY(price, adjustedMinPrice, adjustedMaxPrice, chartHeight);
        if (
          y >= dimensions.padding.top &&
          y <= dimensions.height - dimensions.padding.bottom
        ) {
          ctx.strokeStyle = currentTheme?.grid || defaultTheme.grid;
          ctx.lineWidth = 0.5;
          ctx.beginPath();
          ctx.moveTo(dimensions.padding.left, y);
          ctx.lineTo(dimensions.width - dimensions.padding.right, y);
          ctx.stroke();
        }
      });

      // Draw vertical grid lines
      visibleData.forEach((candle, i) => {
        const candleCenterX =
          dimensions.padding.left + i * barWidth + barWidth / 2;
        const date = new Date(candle.timestamp);
        const minutes = date.getMinutes();
        const hours = date.getHours();

        if (minutes === 0 || (hours === 9 && minutes === 15)) {
          ctx.strokeStyle = currentTheme?.grid || defaultTheme.grid;
          ctx.lineWidth = 0.5;
          ctx.setLineDash([]);
          ctx.beginPath();
          ctx.moveTo(candleCenterX, dimensions.padding.top);
          ctx.lineTo(
            candleCenterX,
            dimensions.height - dimensions.padding.bottom
          );
          ctx.stroke();
        }
      });

      // Draw candlesticks
      visibleData.forEach((candle, i) => {
        const x = dimensions.padding.left + i * barWidth;
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
        ctx.strokeStyle =
          candle.close >= candle.open
            ? currentTheme?.upColor || defaultTheme.upColor
            : currentTheme?.downColor || defaultTheme.downColor;

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

      // Draw price labels
      const skipFactor = Math.ceil(priceLabels.length / 8);
      priceLabels.forEach((label, i) => {
        if (i % skipFactor === 0) {
          ctx.fillStyle = currentTheme?.text || defaultTheme.text;
          ctx.textAlign = "left";
          ctx.textBaseline = "middle";
          ctx.fillText(
            label.text,
            dimensions.width - dimensions.padding.right + 5,
            label.y
          );
        }
      });
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

  // Add new state for x-axis drag
  const [xAxisDragState, setXAxisDragState] = useState<{
    startX: number;
    startScaleX: number;
  } | null>(null);

  // Add separate handler for x-axis canvas
  const handleXAxisMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!xAxisCanvasRef.current) return;

    const rect = xAxisCanvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;

    if (
      x >= dimensions.padding.left &&
      x <= dimensions.width - dimensions.padding.right
    ) {
      setXAxisDragState({
        startX: e.clientX,
        startScaleX: viewState.scaleX,
      });
      e.currentTarget.style.cursor = "ew-resize";
    }
  };

  const handleXAxisMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!xAxisDragState) return;

    const dx = e.clientX - xAxisDragState.startX;
    const scaleFactor = 1 - dx / 200;
    const newScaleX = Math.max(
      0.1,
      Math.min(5, xAxisDragState.startScaleX * scaleFactor)
    );

    const chartWidth =
      dimensions.width - dimensions.padding.left - dimensions.padding.right;
    const newBarWidth = BASE_CANDLE_WIDTH * newScaleX;
    const newVisibleBars = Math.floor(chartWidth / newBarWidth);

    setViewState((prev) => {
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
  };

  const handleXAxisMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setXAxisDragState(null);
    e.currentTarget.style.cursor = "default";
  };

  const handleXAxisMouseLeave = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (xAxisDragState) {
      setXAxisDragState(null);
      e.currentTarget.style.cursor = "default";
    }
  };

  // Add new effect to draw x-axis
  useEffect(() => {
    if (!xAxisCanvasRef.current || !data.length) return;

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

    // Draw time labels
    ctx.fillStyle = currentTheme?.text || defaultTheme.text;
    ctx.textAlign = "center";
    ctx.font = "10px sans-serif";

    const chartWidth =
      dimensions.width - dimensions.padding.left - dimensions.padding.right;
    const barWidth = BASE_CANDLE_WIDTH * viewState.scaleX;

    // Get visible data
    const visibleData = combinedData.slice(
      viewState.startIndex,
      viewState.startIndex + viewState.visibleBars
    );

    // Draw scaling handles at the edges
    const handleWidth = 10;
    const handleHeight = 15;

    // Left handle
    ctx.fillStyle = currentTheme?.grid || defaultTheme.grid;
    ctx.fillRect(
      dimensions.padding.left - handleWidth / 2,
      0,
      handleWidth,
      handleHeight
    );

    // Right handle
    ctx.fillRect(
      dimensions.width - dimensions.padding.right - handleWidth / 2,
      0,
      handleWidth,
      handleHeight
    );

    // Draw time labels with proper spacing
    visibleData.forEach((candle, i) => {
      const x = dimensions.padding.left + i * barWidth + barWidth / 2;
      const date = new Date(candle.timestamp);
      const hours = date.getHours();
      const minutes = date.getMinutes();

      // Draw time labels at significant points
      if (minutes === 0 || (hours === 9 && minutes === 15)) {
        let timeLabel;

        // Show full date at market open (9:15)
        if (hours === 9 && minutes === 15) {
          timeLabel = `${date.toLocaleDateString()} ${date.toLocaleTimeString(
            undefined,
            {
              hour: "2-digit",
              minute: "2-digit",
              hour12: false,
            }
          )}`;
        } else {
          timeLabel = date.toLocaleTimeString(undefined, {
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
          });
        }

        // Draw vertical grid line indicator
        ctx.strokeStyle = currentTheme?.grid || defaultTheme.grid;
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, 8);
        ctx.stroke();

        // Draw time label
        ctx.fillStyle = currentTheme?.text || defaultTheme.text;
        ctx.fillText(timeLabel, x, 20);
      }
    });

    // Draw drag hint if in scale mode
    if (xAxisDragState) {
      ctx.fillStyle = currentTheme?.buttonHover || defaultTheme.buttonHover;
      ctx.globalAlpha = 0.2;
      ctx.fillRect(dimensions.padding.left, 0, chartWidth, 30);
      ctx.globalAlpha = 1;
    }
  }, [
    combinedData,
    dimensions,
    viewState,
    timeframeConfig,
    currentTheme,
    defaultTheme,
    xAxisDragState,
    viewState.startIndex,
    viewState.visibleBars,
    viewState.scaleX,
  ]);

  // Add this effect for resize handling
  useEffect(() => {
    if (!containerRef.current) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { height } = entry.contentRect;
        setDimensions((prev) => ({
          ...prev,
          height: height,
        }));
      }
    });

    resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

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
      {/* Main Chart Area */}
      <div
        ref={containerRef}
        style={{
          position: "relative",
          width: "100%",
          height: `calc(100% - ${isRSIEnabled ? rsiHeight + 34 : 30}px)`,
          cursor: isDragging ? "grabbing" : "crosshair",
          touchAction: "none",
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
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

      {/* Conditionally render RSI Indicator */}
      {isRSIEnabled && (
        <>
          {/* Draggable Separator */}
          <div
            style={{
              height: "4px",
              backgroundColor: currentTheme?.grid || defaultTheme.grid,
              cursor: "ns-resize",
              position: "relative",
              zIndex: 3,
            }}
            onMouseDown={handleRSISeparatorMouseDown}
          >
            {/* Visual indicator for draggable area */}
            <div
              style={{
                position: "absolute",
                left: "50%",
                top: "50%",
                transform: "translate(-50%, -50%)",
                width: "30px",
                height: "2px",
                backgroundColor: currentTheme?.text || defaultTheme.text,
                opacity: 0.5,
              }}
            />
          </div>

          {/* RSI Chart */}
          <div
            style={{
              height: `${rsiHeight}px`,
              borderTop: `1px solid ${currentTheme?.grid || defaultTheme.grid}`,
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
      )}

      {/* X-Axis Area with visual feedback */}
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
            height: "100%",
            position: "absolute",
            cursor: xAxisDragState ? "ew-resize" : "default",
          }}
          onMouseDown={handleXAxisMouseDown}
          onMouseMove={handleXAxisMouseMove}
          onMouseUp={handleXAxisMouseUp}
          onMouseLeave={handleXAxisMouseLeave}
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
