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

export const indexNamesTofyersIndexMapping = (index: any, reverse = false) => {
  const indexDetails = INDEX_DETAILS as Record<
    string,
    { indexExchange: string; fyersName: string }
  >;

  if (reverse) {
    // Remove "-INDEX" suffix and split by ":"
    const [exchange, fyersName] = index.replace("-INDEX", "").split(":");

    // Find the original index name by searching through indexDetails
    for (const [indexName, details] of Object.entries(indexDetails)) {
      if (
        details.indexExchange === exchange &&
        details.fyersName === fyersName
      ) {
        return indexName;
      }
    }
    return ""; // Return empty string if no match found
  }

  // Original forward mapping logic
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

  return (
    holidays.map(([date]) => date).includes(formattedDate) || isWeekend(date)
  );
};

export const getIndexNameFromOptionSymbol = ({
  symbol,
}: {
  symbol: string;
}) => {
  return symbol.includes("SENSEX")
    ? "SENSEX"
    : symbol.includes("BANKNIFTY")
      ? "NIFTY-BANK"
      : symbol.includes("NIFTY")
        ? "NIFTY-50"
        : "NIFTY-50";
};

export const getCurrentShoonyaPositionPL = (i: any, lp: any) => {
  return +i.rpnl + +i.netqty * (lp - +i.netavgprc) * +i.prcftr;
};

export const fetchShoonyaNameByFyersSymbol = (fyersSymbol: {
  symbol: string;
  strike_price: number;
  option_type: string;
  expiryDate: string;
}) => {
  // const { exch = exchange, tsym = shoonyaSymbol } = fyersSymbol
  //   ? _symbols.getState().fyersToShoonyaMapping[fyersSymbol] ||
  //     fetchShoonyaNameBySearching(fyersSymbol)
  //   : {};

  if (fyersSymbol.symbol.includes("-EQ")) {
    return {
      exch: "NSE",
      tsym: fyersSymbol.symbol.split("-EQ")[0],
    };
  }

  // Handle options conversion
  const isOption =
    fyersSymbol.option_type === "CE" || fyersSymbol.option_type === "PE";
  if (isOption && fyersSymbol.symbol.startsWith("BSE:")) {
    return {
      exch: "BFO",
      tsym: fyersSymbol.symbol.split("BSE:")[1],
    };
  }

  if (isOption && fyersSymbol.symbol.startsWith("NSE:")) {
    // Extract base symbol between NSE:/BSE: and first number
    const baseSymbol = fyersSymbol.symbol
      .replace(/^(NSE:|BSE:)/, "") // Remove either NSE: or BSE: prefix
      .match(/^([A-Z]+)/)?.[0];

    if (!baseSymbol) return;

    const [day, month, year] = fyersSymbol.expiryDate.split("-");
    const monthNames: { [key: string]: string } = {
      "01": "JAN",
      "02": "FEB",
      "03": "MAR",
      "04": "APR",
      "05": "MAY",
      "06": "JUN",
      "07": "JUL",
      "08": "AUG",
      "09": "SEP",
      "10": "OCT",
      "11": "NOV",
      "12": "DEC",
    };

    return {
      exch: "NFO",
      tsym: `${baseSymbol}${day}${monthNames[month!]}${year!.slice(-2)}${fyersSymbol.option_type[0]}${fyersSymbol.strike_price}`,
    };
  }
};
