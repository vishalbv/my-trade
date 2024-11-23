import { ChartTheme } from "./constants/themes";

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

export interface ViewState {
  scale: number;
  offsetX: number;
  offsetY: number;
  startIndex: number;
  visibleBars: number;
  theme: ChartTheme;
}

export interface Indicator {
  id: string;
  label: string;
  enabled: boolean;
}

export interface ChartTheme {
  background: string;
  text: string;
  grid: string;
  upColor: string;
  downColor: string;
  axisBackground: string;
  crosshair: string;
  buttonHover: string;
}
