import { useState, useEffect, useRef } from "react";
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

export const ChartContainer = ({
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
  const { chartData } = useRealtimeCandles({
    symbol: chartState.symbol,
    timeframe: chartState.timeframe,
  });

  const currentTimeframe = timeframeOptions.find(
    (t) => t.value === chartState.timeframe
  );

  const symbolDrawings = useSelector(
    (state: RootState) => state.states.drawings[chartState.symbol] || []
  );

  const [containerWidth, setContainerWidth] = useState<number | null>(null);

  const selectedDrawing = useSelector(
    (state: RootState) => state.globalChart.selectedDrawing
  );

  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        const width = containerRef.current.offsetWidth;
        const roundedWidth = Math.round(width / 30) * 30;
        setContainerWidth(roundedWidth);
      }
    };

    const resizeObserver = new ResizeObserver(handleResize);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => {
      if (containerRef.current) {
        resizeObserver.unobserve(containerRef.current);
      }
    };
  }, [containerRef]);

  useEffect(() => {
    if (containerRef.current) {
      const resizeEvent = new Event("resize");
      window.dispatchEvent(resizeEvent);
    }
  }, [chartKey, indicators]);

  const handleDrawingComplete = (drawing: Drawing) => {
    dispatch(addDrawing({ symbol: chartState.symbol, drawing }) as any);
  };

  const handleDrawingUpdate = (drawing: Drawing) => {
    dispatch(updateDrawing({ symbol: chartState.symbol, drawing }) as any);
  };

  const handleChartClick = () => {
    dispatch(setSelectedChartKey(chartKey));
  };

  const currentTimeframeConfig = timeframeConfigs[chartState.timeframe];
  if (!currentTimeframeConfig) {
    console.error(`No timeframe config found for ${chartState.timeframe}`);
    return null; // Or render an error state
  }

  const handleDoubleClick = () => {
    dispatch(setChartFullScreenId(chartKey));
    console.log("double clicked");
  };

  return (
    <div
      ref={containerRef}
      className={cn(
        "flex flex-col h-full",
        selectedChartKey === chartKey && selectedLayout !== "single"
          ? "border-blue-500 border dark:border-0.5"
          : "border-transparent border dark:border-0.5",
        chartFullScreenId === chartKey && "absolute inset-0 z-50",
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
              drawingId={selectedDrawing.drawingId}
              onClose={() => dispatch(setSelectedDrawing(null))}
            />
          )}
        </div>
      </div>

      {/* Chart Content */}
      <SymbolSearch
        isOpen={isSymbolSearchOpen}
        onClose={() => setIsSymbolSearchOpen(false)}
        onSymbolSelect={(symbol) => {
          dispatch(
            updateLayoutSymbol({
              chartKey,
              symbol: shoonyaToFyersSymbol(symbol, updateFyersToShoonyaMapping),
            })
          );
          setIsSymbolSearchOpen(false);
        }}
      />
      <div className="flex-1 min-h-0" onDoubleClick={handleDoubleClick}>
        <CanvasChart
          key={`${selectedLayout}-${chartKey}-${chartState.symbol}-${chartState.timeframe}-${containerWidth}-${chartFullScreenId}`}
          data={chartData}
          timeframeConfig={currentTimeframeConfig}
          indicators={indicators}
          selectedTool={selectedTool}
          showDrawings={showDrawings}
          drawings={symbolDrawings}
          onDrawingComplete={handleDrawingComplete}
          onDrawingUpdate={handleDrawingUpdate}
          chartState={chartState}
        />
      </div>
    </div>
  );
};
