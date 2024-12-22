import {
  SingleChartIcon,
  HorizontalSplitIcon,
  TopTwoBottomOneIcon,
  GridLayoutIcon,
  VerticalSplitLeftIcon,
  VerticalSplitRightIcon,
  VerticalStackIcon,
  HorizontalThreeIcon,
} from "../Chart/icons/layoutIcons";

interface TimeframeConfig {
  resolution: string;
  minScaleDays: number;
  maxScaleDays: number;
  tickFormat: (timestamp: number) => string;
}

export const timeframeConfigs: { [key: string]: TimeframeConfig } = {
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
export type LayoutType =
  | "single"
  | "horizontal"
  | "vertical"
  | "verticalLeft"
  | "verticalRight"
  | "topTwo"
  | "grid"
  | "horizontalThree";

interface LayoutOption {
  id: LayoutType;
  label: string;
  icon: React.ReactNode;
}

export const layoutOptions: LayoutOption[] = [
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
  {
    id: "horizontalThree",
    label: "Three Horizontal",
    icon: <HorizontalThreeIcon />,
  },
];
