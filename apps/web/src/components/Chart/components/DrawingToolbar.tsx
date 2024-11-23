import React from "react";
import { Button } from "@repo/ui/button";
import { cn } from "@repo/utils/ui/helpers";
import {
  CrosshairIcon,
  HorizontalLineIcon,
  TrendLineIcon,
  FibonacciIcon,
} from "../icons/drawingIcons";

export type DrawingTool = "horizontalLine" | "trendLine" | "fibonacci" | null;

interface DrawingToolbarProps {
  activeTool: DrawingTool;
  onToolSelect: (tool: DrawingTool) => void;
}

const drawingTools = [
  {
    id: null as DrawingTool,
    label: "Crosshair",
    icon: <CrosshairIcon />,
  },
  {
    id: "horizontalLine" as DrawingTool,
    label: "Horizontal Line",
    icon: <HorizontalLineIcon />,
  },
  {
    id: "trendLine" as DrawingTool,
    label: "Trend Line",
    icon: <TrendLineIcon />,
  },
  {
    id: "fibonacci" as DrawingTool,
    label: "Fibonacci Retracement",
    icon: <FibonacciIcon />,
  },
];

export const DrawingToolbar: React.FC<DrawingToolbarProps> = ({
  activeTool,
  onToolSelect,
}) => {
  return (
    <div className="flex items-center gap-1">
      {drawingTools.map((tool) => (
        <Button
          key={tool.id ?? "crosshair"}
          variant="light"
          size="icon"
          className={cn(
            "h-8 w-8 p-1.5",
            (activeTool === tool.id ||
              (activeTool === null && tool.id === null)) &&
              "bg-muted"
          )}
          onClick={() => onToolSelect(tool.id)}
          title={tool.label}
        >
          {tool.icon}
        </Button>
      ))}
    </div>
  );
};
