export const layoutIgnorePaths = ["/login", "/"];
export const allStates = [
  "app",
  "shoonya",
  "fyers",
  "flattrade",
  "symbols",
  "drawings",
  "alerts",
];

export const LINKS = [
  {
    heading: "Trading Accounts",
    links: [
      { heading: "Kite", link: "https://kite.zerodha.com/dashboard" },
      { heading: "Fyers-trade", link: "https://trade.fyers.in/" },
      {
        heading: "SHOONYA",
        link: "https://shoonya.finvasia.com/#/index/limits",
      },
    ],
  },

  {
    heading: "Others",
    links: [
      { heading: "tradingView", link: "https://in.tradingview.com/" },
      {
        heading: "Fyers-Api-dashboard",
        link: "https://api-dashboard.fyers.in/",
      },
      {
        heading: "MY-SHEET",
        link: "https://docs.google.com/spreadsheets/d/1m5yvQUZeHlXoTXyyCTEM8cWlDT2cKJnomInJ7XULdwg/edit#gid=1495734824",
      },
    ],
  },

  {
    heading: "Development",
    links: [
      {
        heading: "tailwind css",
        link: "https://tailwindcss.com/docs/installation",
      },
      {
        heading: "@mui docs",
        link: "https://mui.com/components/",
      },
      {
        heading: "@mui icons",
        link: "https://mui.com/components/material-icons/",
      },
      {
        heading: "shoonya API",
        link: "https://github.com/Shoonya-Dev/ShoonyaApi-js",
      },
      {
        heading: "Fyers-Api-v3",
        link: "https://myapi.fyers.in/docsv3",
      },
      {
        heading: "mongo-db",
        link: "https://cloud.mongodb.com/v2/63b91664a85e19598b327701#/metrics/replicaSet/641fb3c78723126bc5488411/explorer/trade-app/states/find",
      },
    ],
  },
];

export const DEFAULT_CHART_LAYOUT = {
  symbol: "NSE:NIFTY50-INDEX",
  timeframe: "1",
  drawings: [],
};

export const STYLES = {
  footer: {
    height: "24px",
  },
  header: {
    height: "56px",
  },
};
