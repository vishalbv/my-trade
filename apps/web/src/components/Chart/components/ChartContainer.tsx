import { useState, useEffect, useRef, useCallback, memo, useMemo } from "react";
import CanvasChart from "../CanvasChart";
import { useRealtimeCandles } from "../hooks/useRealtimeCandles";
import { Button } from "@repo/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@repo/ui/dropdown-menu";
import { Separator } from "@repo/ui/separator";
import { cn } from "@repo/utils/ui/helpers";
import { TimeframeConfig, Drawing } from "../types";
import { SymbolSearch } from "./SymbolSearch";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../../../store/store";
import {
  initializeLayout,
  updateLayoutSymbol,
  updateLayoutTimeframe,
  setSelectedChartKey,
  setChartFullScreenId,
  setSelectedDrawing,
} from "../../../store/slices/globalChartSlice";
import { DEFAULT_CHART_LAYOUT } from "../../../utils/constants";
import { shoonyaToFyersSymbol } from "@repo/utils/helpers";

import { updateFyersToShoonyaMapping } from "../../../store/actions/symbolsActions";
import { AlertBuySellWindow } from "./AlertBuySellWindow";
import {
  addDrawing,
  updateDrawing,
} from "../../../store/actions/drawingActions";
import { useOptimizedRenderer } from "../hooks/useOptimizedRenderer";
import { debounce } from "lodash";

interface Indicator {
  id: string;
  label: string;
  enabled: boolean;
}

interface ChartLayout {
  symbol: string;
  timeframe: string;
  drawings: Drawing[];
}

interface ChartContainerProps {
  timeframeConfigs: { [key: string]: TimeframeConfig };
  chartKey: string;
  indicators: Indicator[];
  className?: string;
}

const timeframeOptions = [
  { value: "1", label: "1 Minute", shortLabel: "1m" },
  { value: "5", label: "5 Minutes", shortLabel: "5m" },
  { value: "15", label: "15 Minutes", shortLabel: "15m" },
  { value: "D", label: "1 Day", shortLabel: "1D" },
];

export const ChartContainer = memo(
  ({
    timeframeConfigs,
    chartKey,
    indicators,
    className,
  }: ChartContainerProps) => {
    const dispatch = useDispatch();
    const { selectedTool, showDrawings, selectedChartKey, chartFullScreenId } =
      useSelector((state: RootState) => state.globalChart);
    const chartState = useSelector((state: RootState) => {
      if (!state.globalChart.layouts[chartKey]) {
        dispatch(initializeLayout({ chartKey }));
        return state.globalChart.layouts[0] || DEFAULT_CHART_LAYOUT;
      }
      return state.globalChart.layouts[chartKey];
    });

    const [isSymbolSearchOpen, setIsSymbolSearchOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const { selectedLayout } = useSelector(
      (state: RootState) => state.globalChart
    );
    const realtimeCandlesConfig = useMemo(
      () => ({
        symbol: chartState.symbol,
        timeframe: chartState.timeframe,
        requestTicksSubscription: false,
      }),
      [chartState.symbol, chartState.timeframe]
    );
    const { chartData, setChartData } = useRealtimeCandles(
      realtimeCandlesConfig
    );

    const currentTimeframe = timeframeOptions.find(
      (t) => t.value === chartState.timeframe
    );

    const symbolDrawings = useSelector(
      (state: RootState) => state.states.drawings[chartState.symbol] || []
    );

    // const [containerWidth, setContainerWidth] = useState<number | null>(null);

    const selectedDrawing = useSelector(
      (state: RootState) => state.globalChart.selectedDrawing
    );

    // const scheduleRender = useOptimizedRenderer();
    // const chartRef = useRef<HTMLDivElement>(null);

    // const handleResize = useCallback(() => {
    //   if (!chartRef.current) return;

    //   scheduleRender(chartKey, () => {
    //     const width = chartRef.current!.offsetWidth;
    //     const roundedWidth = Math.round(width / 30) * 30;
    //     setContainerWidth(roundedWidth);
    //   });
    // }, [chartKey, scheduleRender]);

    // useEffect(() => {
    //   const observer = new ResizeObserver(debounce(handleResize, 100));
    //   if (chartRef.current) {
    //     observer.observe(chartRef.current);
    //   }
    //   return () => observer.disconnect();
    // }, [handleResize]);

    useEffect(() => {
      if (containerRef.current) {
        const resizeEvent = new Event("resize");
        window.dispatchEvent(resizeEvent);
      }
    }, [chartKey, indicators]);

    const handleDrawingComplete = useCallback(
      (drawing: Drawing) => {
        dispatch(addDrawing({ symbol: chartState.symbol, drawing }) as any);
      },
      [dispatch, chartState.symbol]
    );

    const handleDrawingUpdate = useCallback(
      (drawing: Drawing) => {
        dispatch(updateDrawing({ symbol: chartState.symbol, drawing }) as any);
      },
      [dispatch, chartState.symbol]
    );

    const handleChartClick = useCallback(() => {
      dispatch(setSelectedChartKey(chartKey));
    }, [dispatch, chartKey]);

    const currentTimeframeConfig = timeframeConfigs[chartState.timeframe];
    if (!currentTimeframeConfig) {
      console.error(`No timeframe config found for ${chartState.timeframe}`);
      return null; // Or render an error state
    }

    const handleDoubleClick = () => {
      dispatch(setChartFullScreenId(chartKey));
      console.log("double clicked");
    };

    const [containerDimensions, setContainerDimensions] = useState({
      width: 0,
      height: 0,
    });
    const previousDimensions = useRef({ width: 0, height: 0 });
    const animationRef = useRef<number>();

    // Smooth dimension transition
    const updateDimensions = useCallback(
      (newWidth: number, newHeight: number) => {
        const startWidth = previousDimensions.current.width;
        const startHeight = previousDimensions.current.height;
        const startTime = performance.now();
        const duration = 300; // Animation duration in ms

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

    // ResizeObserver setup
    useEffect(() => {
      if (!containerRef.current) return;

      const observer = new ResizeObserver((entries) => {
        for (const entry of entries) {
          const { width, height } = entry.contentRect;
          // Only update if change is significant (> 1px)
          if (
            Math.abs(width - previousDimensions.current.width) > 1 ||
            Math.abs(height - previousDimensions.current.height) > 1
          ) {
            updateDimensions(Math.round(width), Math.round(height));
          }
        }
      });

      observer.observe(containerRef.current);

      return () => {
        observer.disconnect();
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current);
        }
      };
    }, [updateDimensions]);

    // Clean up animation on unmount
    useEffect(() => {
      return () => {
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current);
        }
      };
    }, []);

    return (
      <div
        className={cn(
          "flex flex-col h-full",
          selectedChartKey === chartKey && selectedLayout !== "single"
            ? "border-blue-500 border dark:border-0.5"
            : "border-transparent border dark:border-0.5",
          chartFullScreenId === chartKey
            ? "absolute inset-0 z-50"
            : chartFullScreenId
              ? "w-0"
              : "",
          className
        )}
        onMouseDown={handleChartClick}
      >
        {/* Chart Header */}
        <div className="flex items-center p-1 border-b border-border bg-background">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center">
              {/* Symbol Button */}
              <Button
                variant="ghost"
                onClick={() => setIsSymbolSearchOpen(true)}
                className="h-6 px-2 text-sm hover:bg-muted"
              >
                <span className="mr-1">
                  {chartState.symbol.split(":")[1]?.replace("-INDEX", "") || ""}
                </span>
                <span className="text-xs text-muted-foreground">NSE</span>
              </Button>

              <Separator orientation="vertical" className="mx-1 h-4" />

              {/* Timeframe Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="h-6 px-2 text-sm hover:bg-muted"
                  >
                    {currentTimeframe?.shortLabel}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-[120px]">
                  {timeframeOptions.map((option) => (
                    <DropdownMenuItem
                      key={option.value}
                      onClick={() =>
                        dispatch(
                          updateLayoutTimeframe({
                            chartKey,
                            timeframe: option.value,
                          })
                        )
                      }
                      className={cn(
                        chartState.timeframe === option.value
                          ? "bg-muted"
                          : "hover:bg-muted"
                      )}
                    >
                      <span>{option.label}</span>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Alert Button */}
            {selectedDrawing?.symbol === chartState.symbol && (
              <AlertBuySellWindow
                symbol={chartState.symbol}
                drawingId={selectedDrawing?.drawing?.id}
                onClose={() => dispatch(setSelectedDrawing(null))}
              />
            )}
          </div>
        </div>

        {/* Chart Content */}
        {isSymbolSearchOpen && (
          <SymbolSearch
            isOpen={isSymbolSearchOpen}
            onClose={() => setIsSymbolSearchOpen(false)}
            onSymbolSelect={(symbol: any) => {
              console.log("symbol", symbol);
              setChartData([]);
              if (symbol.fyToken) {
                // if symbol has fyToken, then no need to update fyers to shoonya mapping
                dispatch(
                  updateLayoutSymbol({
                    chartKey,
                    symbol: symbol.symbol,
                    symbolInfo: symbol,
                  })
                );
              } else {
                dispatch(
                  updateLayoutSymbol({
                    chartKey,
                    symbol: shoonyaToFyersSymbol(
                      symbol,
                      updateFyersToShoonyaMapping
                    ),
                  })
                );
              }
              setIsSymbolSearchOpen(false);
            }}
          />
        )}
        <div
          className="flex-1 min-h-0"
          onDoubleClick={handleDoubleClick}
          ref={containerRef}
        >
          <CanvasChart
            data={chartData}
            timeframeConfig={currentTimeframeConfig}
            indicators={indicators}
            selectedTool={selectedTool}
            showDrawings={showDrawings}
            drawings={symbolDrawings}
            onDrawingComplete={handleDrawingComplete}
            onDrawingUpdate={handleDrawingUpdate}
            chartState={chartState}
            dimensions={{
              ...containerDimensions,
              width: containerDimensions.width,
              height: containerDimensions.height - 30,
              padding: { top: 0, right: 60, bottom: 0, left: 0 },
            }}
          />
        </div>
      </div>
    );
  }
);
