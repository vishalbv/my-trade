export const DB_URL =
  "mongodb+srv://vishal:26KuhIZvAkxLPMvD@cluster0.z9fziyu.mongodb.net/test?retryWrites=true&w=majority";
export const API_URL = "http://127.0.0.1:2300/api/";
export const REDIRECT_URL = "http://127.0.0.1:2301/login/";

export const _allStates = ["app", "shoonya", "fyers"];

//date formats
export const DDMMYYYY = "DD-MM-YYYY";

export const INDEX_DETAILS = {
  "NIFTY-50": {
    name: "NIFTY-50",
    freezeQty: 1800,
    lotSize: 50,
    strikeOffset: 50,
    expiryDay: 4,
    exchange: "NFO",
    indexExchange: "NSE",
    shoonyaToken: 26000,
    shoonyaSearchName: "NIFTY",
    fyersName: "NIFTY50",
  },
  "NIFTY-BANK": {
    name: "NIFTY-BANK",
    freezeQty: 900,
    lotSize: 15,
    strikeOffset: 100,
    expiryDay: 3,
    exchange: "NFO",
    indexExchange: "NSE",
    shoonyaToken: 26009,
    shoonyaSearchName: "BANKNIFTY",
    fyersName: "NIFTYBANK",
  },

  SENSEX: {
    name: "SENSEX",
    freezeQty: 1000,
    lotSize: 10,
    strikeOffset: 100,
    expiryDay: 5,
    exchange: "BFO",
    indexExchange: "BSE",
    shoonyaToken: 1,
    shoonyaSearchName: "SENSEX",
    fyersName: "SENSEX",
  },
  BANKEX: {
    name: "BANKEX",
    freezeQty: 500,
    lotSize: 15,
    strikeOffset: 100,
    expiryDay: 1,
    exchange: "BFO",
    indexExchange: "BSE",
    shoonyaToken: 12,
    shoonyaSearchName: "BANKEX",
    fyersName: "BANKEX",
  },
  "FIN-NIFTY": {
    name: "FIN-NIFTY",
    freezeQty: 1800,
    lotSize: 40,
    strikeOffset: 50,
    expiryDay: 2,
    exchange: "NFO",
    indexExchange: "NSE",
    shoonyaToken: 26037,
    shoonyaSearchName: "FINNIFTY",
    fyersName: "FINNIFTY",
  },
};
