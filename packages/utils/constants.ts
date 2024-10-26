export const APP_ENV = Bun.env.NODE_ENV || "development";

export const API_URL =
  APP_ENV === "development"
    ? "http://localhost:2300/api/"
    : "https://api.trader.com/api/";

export const _allStates = ["app", "shoonya", "fyers"];
