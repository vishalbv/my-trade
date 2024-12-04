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
