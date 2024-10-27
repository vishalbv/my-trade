export const APP_ENV = (() => {
  if (typeof Bun !== "undefined") {
    return Bun.env.NODE_ENV || "development";
  } else if (typeof process !== "undefined" && process.env) {
    return process.env.NODE_ENV || "development";
  } else {
    return "development";
  }
})();

export const DB_URL =
  "mongodb+srv://vishal:26KuhIZvAkxLPMvD@cluster0.z9fziyu.mongodb.net/test?retryWrites=true&w=majority";
export const API_URL =
  APP_ENV === "development"
    ? "http://localhost:2300/api/"
    : "https://api.trader.com/api/";

export const REDIRECT_URL = "http://127.0.0.1:2301/login/";

export const _allStates = ["app", "shoonya", "fyers"];
