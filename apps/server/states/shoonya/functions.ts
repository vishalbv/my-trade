export const getNewTicks = (oldTicks: string[], newTicks: string[]) => {
  return newTicks.filter((i) => !oldTicks.includes(i));
};

export const getCurrentValue = (i: any, ticks: any) => {
  return +i.rpnl + +i.netqty * (+ticks[i.token]?.lp - +i.netavgprc) * +i.prcftr;
};

export const getShoonyaPL = (positions: any, ticks: any) => {
  const pl =
    (
      positions &&
      positions[0] &&
      positions
        .map((i: any) => {
          return getCurrentValue(i, ticks);
        })
        .reduce((a: number, b: number) => +a + +b)
    )?.toFixed(2) || 0;
  return isNaN(pl) ? null : +pl;
};

export const positionsFormatter = ({ positions, currentState }: any) => {
  return {
    positions,
    _db: true,
    ...(positions[0] && positions.findIndex((i: any) => i.netqty != 0) == -1
      ? (() => {
          const _data = positions.reduce(
            (a: number, b: any) => +a + +b.rpnl,
            0
          );
          let { maxProfitTillNow, noOfTrades } = currentState;

          return {
            // tillLastTrade: _data,
            maxProfitTillNow:
              _data > maxProfitTillNow ? _data : maxProfitTillNow,
            noOfTrades: maxProfitTillNow == _data ? noOfTrades : noOfTrades + 1,
          };
        })()
      : {}),
  };
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
    const monthNames = {
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
      tsym: `${baseSymbol}${day}${monthNames[month]}${year.slice(-2)}${fyersSymbol.option_type[0]}${fyersSymbol.strike_price}`,
    };
  }
};
