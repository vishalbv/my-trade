export const _brokers = [
  { label: "fyers", id: "fyers" },
  { label: "shoonya", id: "shoonya" },
];

export const _app = { label: "app", id: "app" };
export const _optionBuy = { label: "option-buy", id: "option_buy" };
export const _stocksManage = { label: "stocks-manage", id: "stocks_manage" };

export const _chartData = { label: "chart_data", id: "chart_data" };

export const _allStates = [
  _app,
  ..._brokers,
  ..._strategies,
  _optionBuy,
  _chartData,
  _stocksManage,
];
