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
    fyersSymbol = indexNamesTofyersIndexMapping(symbol.name);
  } else if (symbol.exch === "NSE") {
    fyersSymbol = "NSE:" + symbol.tsym;
  } else if (symbol.exch === "NFO" || symbol.exch === "BFO") {
    fyersSymbol = shoonyaToFyersSymbolOptionMapping(symbol);
  } else fyersSymbol = symbol.replace("~", ".");
  callback({ [fyersSymbol]: symbol });
  return fyersSymbol;
};

export const indexNamesTofyersIndexMapping = (index: any) => {
  const indexDetails = INDEX_DETAILS as Record<
    string,
    { indexExchange: string; fyersName: string }
  >;
  const { indexExchange, fyersName } = indexDetails[index] || {
    indexExchange: "",
    fyersName: "",
  };
  return indexExchange + ":" + fyersName + "-INDEX";
};

export const shoonyaToFyersSymbolOptionMapping = (symbol: any) => {
  if (symbol.exch === "BFO") {
    return "BSE:" + symbol.tsym;
  }
  const months: Record<string, string> = {
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

// Helper function to check if date is weekend
const isWeekend = (date: Date): boolean => {
  const day = date.getDay();
  return day === 0 || day === 6; // 0 is Sunday, 6 is Saturday
};

export const isHoliday = (date: Date, holidays: string[]): boolean => {
  const formattedDate = date
    .toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    })
    .replace(/ /g, "-");

  return holidays.includes(formattedDate) || isWeekend(date);
};
