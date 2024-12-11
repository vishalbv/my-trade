import { ChartTheme } from "../types";

export const CHART_FONT_FAMILY =
  "-apple-system, BlinkMacSystemFont, 'Trebuchet MS', Roboto, Ubuntu, sans-serif";

export const themes: { [key: string]: ChartTheme } = {
  dark: {
    background: "#131722",
    text: "#D1D4DC",
    textSecondary: "#bfbfc6",
    grid: "#363A45",
    crosshair: "#758696",
    axisBackground: "#131722",
    upColor: "#0b9981",
    downColor: "#f23645",
    upColorDark: "#183236",
    downColorDark: "#401f2a",
    buttonHover: "#2A2E39",
    accent: "#2962FF",
    controlsBackground: "#1E222D",
    baseText: "#fff",
    fontFamily: CHART_FONT_FAMILY,
  },
  light: {
    background: "#FFFFFF",
    text: "#131722",
    textSecondary: "#787B86",
    grid: "#D6DCDE",
    crosshair: "#758696",
    axisBackground: "#FFFFFF",
    upColor: "#0b9981",
    downColor: "#f23645",
    upColorDark: "#4e6a66",
    downColorDark: "#ac5454",
    buttonHover: "#F0F3FA",
    accent: "#2962FF",
    controlsBackground: "#F8F9FD",
    baseText: "#000",
    fontFamily: CHART_FONT_FAMILY,
  },
};
