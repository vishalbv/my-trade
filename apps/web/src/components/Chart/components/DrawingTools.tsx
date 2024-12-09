import { Button } from "@repo/ui/button";
import { cn } from "@repo/utils/ui/helpers";
import {
  CursorIcon,
  DeleteIcon,
  EyeIcon,
  FibonacciIcon,
  HorizontalLineIcon,
  RectIcon,
  TrendLineIcon,
  EyeOffIcon,
  ShortPositionIcon,
  LongPositionIcon,
} from "./DrawingToolsIcons";
import { useDispatch, useSelector } from "react-redux";

import { RootState } from "../../../store/store";
import { clearDrawings } from "../../../store/actions/drawingActions";
export type DrawingTool =
  | "cursor"
  | "horizontalLine"
  | "trendline"
  | "fibonacci"
  | "rect"
  | "longPosition"
  | "shortPosition";

interface DrawingToolsProps {
  selectedTool: DrawingTool | null;
  setSelectedTool: (tool: DrawingTool | null) => void;
  showDrawings: boolean;
  setShowDrawings: (show: boolean) => void;
}

export function DrawingTools({
  selectedTool,
  setSelectedTool,
  showDrawings,
  setShowDrawings,
}: DrawingToolsProps) {
  const dispatch = useDispatch();
  const currentSymbol = useSelector((state: RootState) => {
    const selectedKey = state.globalChart.selectedChartKey;
    return state.globalChart.layouts[selectedKey]?.symbol;
  });
  const selectedDrawing = useSelector(
    (state: RootState) => state.globalChart.selectedDrawing
  );

  const tools = [
    { id: "cursor" as DrawingTool, icon: CursorIcon, label: "Cursor" },
    {
      id: "horizontalLine" as DrawingTool,
      icon: HorizontalLineIcon,
      label: "Horizontal Line",
    },
    {
      id: "trendline" as DrawingTool,
      icon: TrendLineIcon,
      label: "Trend Line",
    },

    {
      id: "fibonacci" as DrawingTool,
      icon: FibonacciIcon,
      label: "Fibonacci Retracement",
    },
    {
      id: "rect" as DrawingTool,
      icon: RectIcon,
      label: "Rectangle",
    },
    {
      id: "shortPosition" as DrawingTool,
      icon: ShortPositionIcon,
      label: "Short Position",
    },
    {
      id: "longPosition" as DrawingTool,
      icon: LongPositionIcon,
      label: "Long Position",
    },
  ];

  const handleToolClick = (toolId: DrawingTool) => {
    if (selectedTool === toolId) {
      // If clicking the same tool, switch back to cursor
      setSelectedTool("cursor");
    } else {
      // Otherwise, select the new tool
      setSelectedTool(toolId);
    }
  };

  const handleClearDrawings = () => {
    if (currentSymbol) {
      dispatch(clearDrawings(currentSymbol));
    }
  };

  return (
    <div className="flex flex-col gap-2">
      {/* Drawing Tools */}
      {tools.map((tool) => (
        <Button
          key={tool.id}
          variant="light"
          size="icon"
          className={cn(
            "h-8 w-8 p-0.5",
            selectedTool === tool.id && "bg-muted"
          )}
          onClick={() => handleToolClick(tool.id)}
          title={tool.label}
        >
          <tool.icon className="!h-4/5 !w-4/5" />
        </Button>
      ))}

      {/* Separator */}
      <div className="h-px bg-border my-1" />

      {/* Show/Hide Drawings */}
      <Button
        variant="light"
        size="icon"
        className={cn("h-8 w-8", !showDrawings && "text-muted-foreground")}
        onClick={() => setShowDrawings(!showDrawings)}
        title={showDrawings ? "Hide Drawings" : "Show Drawings"}
      >
        {showDrawings ? (
          <EyeIcon className="!h-4/5 !w-4/5" />
        ) : (
          <EyeOffIcon className="!h-4/5 !w-4/5" />
        )}
      </Button>

      {/* Clear All Drawings */}
      <Button
        variant="light"
        size="icon"
        className="h-8 w-8"
        onClick={handleClearDrawings}
        title="Clear Drawings from Selected Chart"
      >
        <DeleteIcon className="!h-4/5 !w-4/5" />
      </Button>
    </div>
  );
}
