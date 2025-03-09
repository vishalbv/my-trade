import { LineChart } from "lucide-react";
import { Button } from "@repo/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@repo/ui/dropdown-menu";
import { cn } from "@repo/utils/ui/helpers";
import { LayoutType } from "../types";
import { DrawingTools, DrawingTool } from "./DrawingTools";
import { ExitFullScreenIcon, FullScreenIcon } from "../icons/layoutIcons";
import { useDispatch, useSelector } from "react-redux";
import { setChartFullScreenId } from "../../../store/slices/globalChartSlice";
import { RootState } from "../../../store/store";

const INDICATORS = [
  { id: "rsi", label: "RSI" },
  { id: "swing", label: "Swing Areas" },
  { id: "threeCandle", label: "Three Candle Pattern" },
  { id: "rbKnox", label: "RB Knox Divergence" },
];

interface Indicator {
  id: string;
  label: string;
  enabled: boolean;
}

interface LayoutOption {
  id: LayoutType;
  label: string;
  icon: React.ReactNode;
}

interface ChartToolsProps {
  indicators: Indicator[];
  setIndicators: (indicators: Indicator[]) => void;
  selectedLayout: LayoutType;
  setSelectedLayout: (layout: LayoutType) => void;
  layoutOptions: LayoutOption[];
  currentLayout: LayoutOption | undefined;
  selectedTool: DrawingTool | null;
  setSelectedTool: (tool: DrawingTool | null) => void;
  showDrawings: boolean;
  setShowDrawings: (show: boolean) => void;
  layoutTypeKey: string;
  isLayoutSelectionDisabled?: boolean;
}

export function ChartTools({
  indicators,
  setIndicators,
  selectedLayout,
  setSelectedLayout,
  layoutOptions,
  currentLayout,
  selectedTool,
  setSelectedTool,
  showDrawings,
  setShowDrawings,
  layoutTypeKey,
  isLayoutSelectionDisabled = false,
}: ChartToolsProps) {
  const dispatch = useDispatch();
  const { selectedChartKey, chartFullScreenId } = useSelector(
    (state: RootState) => state.globalChart
  );
  const handleFullScreen = () => {
    dispatch(setChartFullScreenId(chartFullScreenId ? null : selectedChartKey));
  };

  const handleClearDrawings = () => {
    // Implement clear drawings logic
    console.log("Clear all drawings");
  };

  return (
    <div className="flex flex-col gap-2 p-1">
      {/* Indicators Dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="light" size="icon" className="h-8 w-8">
            <LineChart className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent side="right" className="w-[200px]">
          {INDICATORS.map((indicator) => {
            const indicatorData = indicators.find(
              (ind) => ind.id === indicator.id
            );
            return (
              <DropdownMenuItem
                key={indicator.id}
                className="flex items-center justify-between"
                onSelect={(e) => {
                  e.preventDefault();
                  setIndicators(
                    INDICATORS.map((ind) =>
                      ind.id === indicator.id
                        ? { ...ind, enabled: !indicatorData?.enabled }
                        : indicators.find((i) => i.id === ind.id)
                    )
                  );
                }}
              >
                <span>{indicator.label}</span>
                <div className="flex items-center h-4 w-4 rounded-sm border border-primary">
                  {indicatorData?.enabled && (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-3 w-3"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </div>
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Layout Selector Dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild disabled={isLayoutSelectionDisabled}>
          <Button variant="light" size="icon" className="h-8 w-8">
            {currentLayout?.icon}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent side="right" className="w-[144px] p-2">
          <div className="grid grid-cols-3 gap-2">
            {layoutOptions.map((option) => (
              <DropdownMenuItem
                key={option.id}
                onClick={() => setSelectedLayout(option.id)}
                className={cn(
                  selectedLayout === option.id ? "bg-muted" : "hover:bg-muted",
                  "flex items-center justify-center p-2 h-8 w-8"
                )}
                title={option.label}
              >
                {option.icon}
              </DropdownMenuItem>
            ))}
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
      {/* Separator */}
      <div className="h-px bg-border my-1" />

      {/* Drawing Tools */}
      <DrawingTools
        selectedTool={selectedTool}
        setSelectedTool={setSelectedTool}
        showDrawings={showDrawings}
        setShowDrawings={setShowDrawings}
        onClearDrawings={handleClearDrawings}
        layoutTypeKey={layoutTypeKey}
      />

      {/* Full Screen Button */}
      <Button
        variant="light"
        size="icon"
        className={cn(
          "h-8 w-8 absolute bottom-0",
          chartFullScreenId ? "text-primary bg-primary/10" : ""
        )}
        onClick={handleFullScreen}
      >
        {chartFullScreenId ? <ExitFullScreenIcon /> : <FullScreenIcon />}
      </Button>
    </div>
  );
}
