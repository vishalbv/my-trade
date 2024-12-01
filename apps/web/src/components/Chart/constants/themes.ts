import { ChartTheme } from "../types";

export const themes: { [key: string]: ChartTheme } = {
  dark: {
    background: "#131722",
    text: "#D1D4DC",
    textSecondary: "#bfbfc6",
    grid: "#363A45",
    crosshair: "#758696",
    axisBackground: "#131722",
    upColor: "#26A69A",
    downColor: "#EF5350",
    buttonHover: "#2A2E39",
    accent: "#2962FF",
    controlsBackground: "#1E222D",
  },
  light: {
    background: "#FFFFFF",
    text: "#131722",
    textSecondary: "#787B86",
    grid: "#D6DCDE",
    crosshair: "#758696",
    axisBackground: "#FFFFFF",
    upColor: "#26A69A",
    downColor: "#EF5350",
    buttonHover: "#F0F3FA",
    accent: "#2962FF",
    controlsBackground: "#F8F9FD",
  },
};
