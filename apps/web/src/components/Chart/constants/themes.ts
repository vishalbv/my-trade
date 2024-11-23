export interface ChartTheme {
  background: string;
  text: string;
  grid: string;
  crosshair: string;
  upColor: string;
  downColor: string;
  axisBackground: string;
  buttonHover: string;
}

export const themes: { [key: string]: ChartTheme } = {
  dark: {
    background: "#1a1a1a",
    text: "#ffffff",
    grid: "#333333",
    crosshair: "#666666",
    upColor: "#26a69a",
    downColor: "#ef5350",
    axisBackground: "#1a1a1a",
    buttonHover: "#333333",
  },
  light: {
    background: "#ffffff",
    text: "#1a1a1a",
    grid: "#e0e0e0",
    crosshair: "#999999",
    upColor: "#26a69a",
    downColor: "#ef5350",
    axisBackground: "#ffffff",
    buttonHover: "#f5f5f5",
  },
} as const;
