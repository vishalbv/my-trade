"use client";

import CanvasChart from "../../src/components/Chart/CanvasChart";
import { useState } from "react";
import { useRealtimeCandles } from "../../src/components/Chart/hooks/useRealtimeCandles";
import { SymbolSearch } from "../../src/components/Chart/components/SymbolSearch";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@repo/ui/dropdown-menu";
import { Button } from "@repo/ui/button";
import { Separator } from "@repo/ui/separator";
import { cn } from "@repo/utils/ui/helpers";
import { LayoutGrid, Monitor, PanelLeftOpen, PanelTop } from "lucide-react";
import {
  SingleChartIcon,
  HorizontalSplitIcon,
  TopTwoBottomOneIcon,
  GridLayoutIcon,
  VerticalSplitLeftIcon,
  VerticalSplitRightIcon,
  VerticalStackIcon,
} from "../../src/components/Chart/icons/layoutIcons";
import { ChartLayout } from "../../src/components/Chart/components/ChartLayout";

interface TimeframeConfig {
  resolution: string;
  minScaleDays: number;
  maxScaleDays: number;
  tickFormat: (timestamp: number) => string;
}

const timeframeConfigs: { [key: string]: TimeframeConfig } = {
  "1": {
    // 1 minute
    resolution: "1",
    minScaleDays: 0.1, // ~2.4 hours minimum
    maxScaleDays: 5,
    tickFormat: (timestamp: number) => {
      const date = new Date(timestamp);
      return date.getHours() === 9 && date.getMinutes() === 15
        ? `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`
        : date.toLocaleTimeString();
    },
  },
  "5": {
    // 5 minutes
    resolution: "5",
    minScaleDays: 0.2,
    maxScaleDays: 10,
    tickFormat: (timestamp: number) => {
      const date = new Date(timestamp);
      return date.getHours() === 9 && date.getMinutes() === 15
        ? `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`
        : date.toLocaleTimeString();
    },
  },
  "15": {
    // 15 minutes
    resolution: "15",
    minScaleDays: 0.5,
    maxScaleDays: 30,
    tickFormat: (timestamp: number) => {
      const date = new Date(timestamp);
      return `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
    },
  },
  D: {
    // 1 day
    resolution: "D",
    minScaleDays: 5,
    maxScaleDays: 365,
    tickFormat: (timestamp: number) => new Date(timestamp).toLocaleDateString(),
  },
};

const timeframeOptions = [
  { value: "1", label: "1 Minute", shortLabel: "1m" },
  { value: "5", label: "5 Minutes", shortLabel: "5m" },
  { value: "15", label: "15 Minutes", shortLabel: "15m" },
  { value: "D", label: "1 Day", shortLabel: "1D" },
];

// Layout types
type LayoutType =
  | "single"
  | "horizontal"
  | "vertical"
  | "verticalLeft"
  | "verticalRight"
  | "topTwo"
  | "grid";

interface LayoutOption {
  id: LayoutType;
  label: string;
  icon: React.ReactNode;
}

const layoutOptions: LayoutOption[] = [
  {
    id: "single",
    label: "Single View",
    icon: <SingleChartIcon />,
  },
  {
    id: "horizontal",
    label: "Horizontal Split",
    icon: <HorizontalSplitIcon />,
  },
  {
    id: "vertical",
    label: "Vertical Stack",
    icon: <VerticalStackIcon />,
  },
  {
    id: "verticalLeft",
    label: "Two Left One Right",
    icon: <VerticalSplitLeftIcon />,
  },
  {
    id: "verticalRight",
    label: "One Left Two Right",
    icon: <VerticalSplitRightIcon />,
  },
  {
    id: "topTwo",
    label: "Two Top One Bottom",
    icon: <TopTwoBottomOneIcon />,
  },
  {
    id: "grid",
    label: "2x2 Grid",
    icon: <GridLayoutIcon />,
  },
];

export default function GlobalChart() {
  const [timeframe, setTimeframe] = useState<string>("1");
  const [symbol, setSymbol] = useState<string>("NSE:NIFTY50-INDEX");
  const [isSymbolSearchOpen, setIsSymbolSearchOpen] = useState(false);
  const [selectedLayout, setSelectedLayout] = useState<LayoutType>("single");

  const currentTimeframe = timeframeOptions.find((t) => t.value === timeframe);
  const currentLayout = layoutOptions.find((l) => l.id === selectedLayout);

  return (
    <div className="relative h-full">
      <div className="flex items-center absolute top-0 right-0 z-10">
        {/* Layout Selector Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="light" className="h-8 px-2 font-normal">
              <span className="flex items-center gap-2">
                {currentLayout?.icon}
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="start"
            className="w-[144px] p-2" // 16px icon * 3 + 8px gap * 2 + 16px padding
          >
            <div className="grid grid-cols-3 gap-2">
              {layoutOptions.map((option) => (
                <DropdownMenuItem
                  key={option.id}
                  onClick={() => setSelectedLayout(option.id)}
                  className={cn(
                    selectedLayout === option.id
                      ? "bg-muted"
                      : "hover:bg-muted",
                    "flex items-center justify-center p-2 h-8 w-8"
                  )}
                  title={option.label} // Show label as tooltip
                >
                  {option.icon}
                </DropdownMenuItem>
              ))}
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Chart container */}
      <div className="relative h-[calc(100%-48px)]">
        <ChartLayout
          layout={selectedLayout}
          timeframeConfigs={timeframeConfigs}
        />
      </div>

      <SymbolSearch
        isOpen={isSymbolSearchOpen}
        onClose={() => setIsSymbolSearchOpen(false)}
        onSymbolSelect={setSymbol}
      />
    </div>
  );
}
