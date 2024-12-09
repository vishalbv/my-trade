"use client";

import { useDispatch, useSelector } from "react-redux";
import {
  setSelectedLayout,
  setIndicators,
  setSelectedTool,
  setShowDrawings,
} from "../../src/store/slices/globalChartSlice";
import { RootState } from "../../src/store/store";

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

import { ChartTools } from "../../src/components/Chart/components/ChartTools";

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
      return `${date.getDate().toString().padStart(2, "0")}-${date.toLocaleString(
        "default",
        {
          month: "short",
        }
      )}-${date.getFullYear()}  ${date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })}`;
    },
  },
  "5": {
    // 5 minutes
    resolution: "5",
    minScaleDays: 0.2,
    maxScaleDays: 10,
    tickFormat: (timestamp: number) => {
      const date = new Date(timestamp);
      return `${date.getDate().toString().padStart(2, "0")}-${date.toLocaleString(
        "default",
        {
          month: "short",
        }
      )}-${date.getFullYear()} ${date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })}`;
    },
  },
  "15": {
    // 15 minutes
    resolution: "15",
    minScaleDays: 0.5,
    maxScaleDays: 30,
    tickFormat: (timestamp: number) => {
      const date = new Date(timestamp);
      return `${date.getDate().toString().padStart(2, "0")}-${date.toLocaleString(
        "default",
        {
          month: "short",
        }
      )}-${date.getFullYear()} ${date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })}`;
    },
  },
  D: {
    // 1 day
    resolution: "D",
    minScaleDays: 5,
    maxScaleDays: 365,
    tickFormat: (timestamp: number) => {
      const date = new Date(timestamp);
      return `${date.getDate().toString().padStart(2, "0")}-${date.toLocaleString(
        "default",
        {
          month: "short",
        }
      )}-${date.getFullYear()}`;
    },
  },
};

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
  const dispatch = useDispatch();
  const { selectedLayout, indicators, selectedTool, showDrawings } =
    useSelector((state: RootState) => state.globalChart);

  return (
    <div className="flex flex-col h-full relative">
      <div className="flex h-full">
        <div className="flex flex-col items-center py-2 border-r border-border">
          <ChartTools
            indicators={indicators}
            setIndicators={(newIndicators) =>
              dispatch(setIndicators(newIndicators))
            }
            selectedLayout={selectedLayout}
            setSelectedLayout={(layout) => dispatch(setSelectedLayout(layout))}
            layoutOptions={layoutOptions}
            currentLayout={layoutOptions.find((l) => l.id === selectedLayout)}
            selectedTool={selectedTool}
            setSelectedTool={(tool) => dispatch(setSelectedTool(tool))}
            showDrawings={showDrawings}
            setShowDrawings={(show) => dispatch(setShowDrawings(show))}
          />
        </div>

        <div className="flex-1 min-h-0 relative">
          <ChartLayout
            layout={selectedLayout}
            timeframeConfigs={timeframeConfigs}
            indicators={indicators}
          />
        </div>
      </div>
    </div>
  );
}
