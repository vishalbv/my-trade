import moment from "moment";
import { DDMMYYYY, INDEX_DETAILS } from "./constants";

export const isDatesEqual = (a: moment.Moment, b = moment()) =>
  a ? moment(a).format(DDMMYYYY) == moment(b).format(DDMMYYYY) : false;

export const getTimeoutTo = (time = moment(), testMode?: boolean) => {
  if (testMode) return 2000;
  const diff = moment.duration(moment(time).diff(moment()));
  const diffMSec = diff.asMilliseconds();
  return diffMSec;
};

export const shoonyaToFyersSymbol = (symbol: any, callback: any) => {
  let fyersSymbol = "";
  if (symbol.type === "index") {
    const indexDetails = INDEX_DETAILS as Record<
      string,
      { name: string; fyersName: string }
    >;
    fyersSymbol = shoonyaToFyersIndexMapping(indexDetails[symbol.name]);
  } else if (symbol.exch === "NSE") {
    fyersSymbol = "NSE:" + symbol.tsym;
  } else if (symbol.exch === "NFO" || symbol.exch === "BFO") {
    fyersSymbol = shoonyaToFyersSymbolOptionMapping(symbol);
  } else fyersSymbol = symbol.replace("~", ".");
  callback({ [fyersSymbol]: symbol });
  return fyersSymbol;
};

export const shoonyaToFyersIndexMapping = (symbol: any) => {
  return symbol.indexExchange + ":" + symbol.fyersName + "-INDEX";
};

export const shoonyaToFyersSymbolOptionMapping = (symbol: any) => {
  if (symbol.exch === "BFO") {
    return "BSE:" + symbol.tsym;
  }
  const months: Record<string, string> = {
    JAN: "01",
    FEB: "02",
    MAR: "03",
    APR: "04",
    MAY: "05",
    JUN: "06",
    JUL: "07",
    AUG: "08",
    SEP: "09",
    OCT: "10",
    NOV: "11",
    DEC: "12",
  };
  let arr = symbol.tsym.match(/[a-zA-Z]+|[0-9]+(?:\.[0-9]+|)/g);
  console.log(arr);
  const monthly = !symbol.weekly || symbol.weekly == "W4";
  const monthKey = arr[2] as keyof typeof months;
  return (
    "NSE:" +
    arr[0] +
    arr[3] +
    (monthly ? arr[2] : months[monthKey]) +
    (monthly ? "" : arr[1]) +
    arr[5] +
    (arr[4] == "P" ? "PE" : "CE")
  );
};
