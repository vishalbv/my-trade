import React, { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@repo/utils/ui/helpers";
import CanvasChart from "../../../components/Chart/CanvasChart";
import { OHLCData } from "../../../services/deltaExchange";
import { useStrategyDrawings } from "../hooks/useStrategyDrawings";
import { useDispatch, useSelector } from "react-redux";
import {
  addDrawing,
  updateDrawing,
} from "../../../store/actions/drawingActions";
import { RootState } from "../../../store/store";

interface BTCChartContainerProps {
  data: OHLCData[];
  timeframeConfig: any;
  isLoading: boolean;
  error: string | null;
}

export const BTCChartContainer: React.FC<BTCChartContainerProps> = ({
  data,
  timeframeConfig,
  isLoading,
  error,
}) => {
  const dispatch = useDispatch();
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerDimensions, setContainerDimensions] = useState({
    width: 0,
    height: 0,
  });
  const previousDimensions = useRef({ width: 0, height: 0 });
  const animationRef = useRef<number>();

  // Get strategy drawings

  const symbolDrawings = useSelector(
    (state: RootState) => state.states.drawings["BTCUSD"] || []
  );

  const { drawings, clearDrawings } = useStrategyDrawings(data);

  // Drawing handlers
  const handleDrawingComplete = useCallback(
    (drawing: any) => {
      dispatch(addDrawing({ symbol: "BTCUSD", drawing }));
    },
    [dispatch]
  );

  const handleDrawingUpdate = useCallback(
    (drawing: any) => {
      dispatch(updateDrawing({ symbol: "BTCUSD", drawing }));
    },
    [dispatch]
  );

  // Smooth dimension transition
  const updateDimensions = useCallback(
    (newWidth: number, newHeight: number) => {
      if (newWidth === 0 || newHeight === 0) return; // Don't update with zero dimensions

      const startWidth = previousDimensions.current.width;
      const startHeight = previousDimensions.current.height;
      const startTime = performance.now();
      const duration = 100; // Animation duration in ms

      // Cancel any existing animation
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }

      const animate = (currentTime: number) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);

        // Ease out cubic function for smooth transition
        const t = 1 - Math.pow(1 - progress, 3);

        const currentWidth = Math.round(
          startWidth + (newWidth - startWidth) * t
        );
        const currentHeight = Math.round(
          startHeight + (newHeight - startHeight) * t
        );

        setContainerDimensions({
          width: currentWidth,
          height: currentHeight,
        });

        if (progress < 1) {
          animationRef.current = requestAnimationFrame(animate);
        } else {
          previousDimensions.current = { width: newWidth, height: newHeight };
        }
      };

      animationRef.current = requestAnimationFrame(animate);
    },
    []
  );

  // Initial dimensions setup
  useEffect(() => {
    if (containerRef.current) {
      const { width, height } = containerRef.current.getBoundingClientRect();
      updateDimensions(width, height);
    }
  }, [updateDimensions]);

  // ResizeObserver setup
  useEffect(() => {
    if (!containerRef.current) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        // Only update if dimensions are non-zero and have changed significantly
        if (
          width > 0 &&
          height > 0 &&
          (Math.abs(width - previousDimensions.current.width) > 1 ||
            Math.abs(height - previousDimensions.current.height) > 1)
        ) {
          updateDimensions(Math.round(width), Math.round(height));
        }
      }
    });

    observer.observe(containerRef.current);

    // Trigger initial measurement
    const { width, height } = containerRef.current.getBoundingClientRect();
    if (width > 0 && height > 0) {
      updateDimensions(Math.round(width), Math.round(height));
    }

    return () => {
      observer.disconnect();
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [updateDimensions]);

  // Window resize handler
  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        const { width, height } = containerRef.current.getBoundingClientRect();
        if (width > 0 && height > 0) {
          updateDimensions(Math.round(width), Math.round(height));
        }
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [updateDimensions]);

  // Clean up animation on unmount
  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">Loading...</div>
    );
  }

  if (error) {
    return <div className="text-red-500">Error: {error}</div>;
  }

  console.log("Container dimensions:", drawings, symbolDrawings);

  return (
    <div className="h-full w-full relative">
      <div ref={containerRef} className="absolute inset-0">
        <CanvasChart
          data={data}
          timeframeConfig={{
            ...timeframeConfig,
            resolution: timeframeConfig.interval,
          }}
          indicators={[]}
          selectedTool={null}
          showDrawings={true}
          drawings={[...symbolDrawings, ...drawings]}
          onDrawingComplete={handleDrawingComplete}
          onDrawingUpdate={handleDrawingUpdate}
          chartState={{
            symbol: "BTCUSD",
            timeframe: "5m",
            symbolInfo: null,
          }}
          dimensions={{
            ...containerDimensions,
            padding: { top: 0, right: 60, bottom: 0, left: 0 },
          }}
          chartKey="btc-chart"
        />
      </div>
    </div>
  );
};
