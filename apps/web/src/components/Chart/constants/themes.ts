import { ChartTheme } from "../types";

export const themes: { [key: string]: ChartTheme } = {
  dark: {
    background: "#131722",
    grid: "#2a2e39",
    text: "#d1d4dc",
    upColor: "#26a69a",
    downColor: "#ef5350",
    crosshair: "rgba(120, 123, 134, 0.7)",
    axisBackground: "rgba(19, 23, 34, 0.85)",
    controlsBackground: "rgb(19, 23, 34)",
    buttonHover: "rgba(250, 250, 250, 0.1)",
  },
  light: {
    background: "#ffffff",
    grid: "#f0f3fa",
    text: "#131722",
    upColor: "#089981",
    downColor: "#f23645",
    crosshair: "rgba(67, 70, 81, 0.7)",
    axisBackground: "rgba(255, 255, 255, 0.85)",
    controlsBackground: "rgb(255, 255, 255)",
    buttonHover: "rgba(0, 0, 0, 0.1)",
  },
};
