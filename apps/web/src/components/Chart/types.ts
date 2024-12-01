export interface OHLCData {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  display?: boolean;
}

export interface TimeframeConfig {
  resolution: string;
  minScaleDays: number;
  maxScaleDays: number;
  tickFormat: (timestamp: number) => string;
}

export interface ChartDimensions {
  width: number;
  height: number;
  padding: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
}

export interface ChartTheme {
  background: string;
  text: string;
  textSecondary: string;
  grid: string;
  crosshair: string;
  axisBackground: string;
  upColor: string;
  downColor: string;
  buttonHover: string;
  accent: string;
  controlsBackground: string;
}

export interface ViewState {
  scaleX: number;
  scaleY: number;
  offsetX: number;
  offsetY: number;
  startIndex: number;
  visibleBars: number;
  theme: ChartTheme;
  minPrice?: number;
  maxPrice?: number;
  rsiHeight?: number;
}

export interface MousePosition {
  x: number;
  y: number;
  price: number;
  timestamp: number;
  visible: boolean;
}

export interface Indicator {
  id: string;
  label: string;
  enabled: boolean;
}

export type LayoutType =
  | "single"
  | "horizontal"
  | "vertical"
  | "verticalLeft"
  | "verticalRight"
  | "topTwo"
  | "grid";

export type DrawingTool =
  | "cursor"
  | "horizontalLine"
  | "trendline"
  | "fibonacci"
  | "rect"
  | "shortPosition"
  | "longPosition";

export interface Drawing {
  id: string;
  type: DrawingTool;
  points: Point[];
  visible: boolean;
}

export interface Point {
  x: number;
  y: number;
  price?: number;
  timestamp?: number;
}

export interface DrawingState {
  tool: DrawingTool | null;
  showDrawings: boolean;
  drawings: Drawing[];
}
