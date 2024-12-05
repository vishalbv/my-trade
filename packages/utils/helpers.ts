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

export const shoonyaToFyersSymbol = (symbol: any) => {
  if (symbol.type === "index") {
    return shoonyaToFyersIndexMapping(INDEX_DETAILS[symbol.name]);
  }
  if (symbol.exch === "NSE") {
    return "NSE:" + symbol.tsym;
  } else if (symbol.exch === "NFO") {
    return shoonyaToFyersSymbolOptionMapping(symbol);
  }
  return symbol.replace("~", ".");
};

export const shoonyaToFyersIndexMapping = (symbol: any) => {
  return symbol.indexExchange + ":" + symbol.fyersName + "-INDEX";
};

export const shoonyaToFyersSymbolOptionMapping = (symbol: any) => {
  let months = {
    JAN: "1",
    FEB: "2",
    MAR: "3",
    APR: "4",
    MAY: "5",
    JUN: "6",
    JUL: "7",
    AUG: "8",
    SEP: "9",
    OCT: "O",
    NOV: "N",
    DEC: "D",
  };
  let arr = symbol.tsym.match(/[a-zA-Z]+|[0-9]+(?:\.[0-9]+|)/g);
  console.log(arr);
  const monthly = !symbol.weekly || symbol.weekly == "W4";
  return (
    "NSE:" +
    arr[0] +
    arr[3] +
    (monthly ? arr[2] : months[arr[2]]) +
    (monthly ? "" : arr[1]) +
    arr[5] +
    (arr[4] == "P" ? "PE" : "CE")
  );
};
