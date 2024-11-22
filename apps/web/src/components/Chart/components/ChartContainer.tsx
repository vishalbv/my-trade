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
import { TimeframeConfig } from "../types";
import { SymbolSearch } from "./SymbolSearch";

interface Indicator {
  id: string;
  label: string;
  enabled: boolean;
}

interface ChartContainerProps {
  timeframeConfigs: { [key: string]: TimeframeConfig };
  initialSymbol?: string;
  initialTimeframe?: string;
  className?: string;
  layoutKey: string;
  indicators: Indicator[];
}

const timeframeOptions = [
  { value: "1", label: "1 Minute", shortLabel: "1m" },
  { value: "5", label: "5 Minutes", shortLabel: "5m" },
  { value: "15", label: "15 Minutes", shortLabel: "15m" },
  { value: "D", label: "1 Day", shortLabel: "1D" },
];

export const ChartContainer = ({
  timeframeConfigs,
  initialSymbol = "NSE:NIFTY50-INDEX",
  initialTimeframe = "1",
  className,
  layoutKey,
  indicators,
}: ChartContainerProps) => {
  const [symbol, setSymbol] = useState(initialSymbol);
  const [timeframe, setTimeframe] = useState(initialTimeframe);
  const [isSymbolSearchOpen, setIsSymbolSearchOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const { chartData } = useRealtimeCandles({
    symbol,
    timeframe,
  });

  const currentTimeframe = timeframeOptions.find((t) => t.value === timeframe);

  useEffect(() => {
    if (containerRef.current) {
      const resizeEvent = new Event("resize");
      window.dispatchEvent(resizeEvent);
    }
  }, [layoutKey, indicators]);

  return (
    <div ref={containerRef} className={cn("flex flex-col h-full", className)}>
      {/* Chart Header */}
      <div className="flex items-center p-1 border-b border-border">
        <div className="flex items-center">
          {/* Symbol Button */}
          <Button
            variant="ghost"
            onClick={() => setIsSymbolSearchOpen(true)}
            className="h-6 px-2 text-sm hover:bg-muted"
          >
            <span className="mr-1">
              {symbol.split(":")[1]?.replace("-INDEX", "") || ""}
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
                  onClick={() => setTimeframe(option.value)}
                  className={cn(
                    timeframe === option.value ? "bg-muted" : "hover:bg-muted"
                  )}
                >
                  <span>{option.label}</span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Chart Content */}
      <SymbolSearch
        isOpen={isSymbolSearchOpen}
        onClose={() => setIsSymbolSearchOpen(false)}
        onSymbolSelect={setSymbol}
      />
      <div className="flex-1 min-h-0">
        <CanvasChart
          key={`${layoutKey}-${symbol}-${timeframe}`}
          data={chartData}
          timeframeConfig={timeframeConfigs[timeframe]}
          indicators={indicators}
        />
      </div>
    </div>
  );
};
