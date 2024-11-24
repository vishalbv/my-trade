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
  grid: string;
  text: string;
  upColor: string;
  downColor: string;
  crosshair: string;
  axisBackground: string;
  controlsBackground: string;
  buttonHover: string;
}

export interface ViewState {
  scaleX: number;
  scaleY: number;
  offsetX: number;
  offsetY: number;
  startIndex: number;
  visibleBars: number;
  theme: ChartTheme;
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
