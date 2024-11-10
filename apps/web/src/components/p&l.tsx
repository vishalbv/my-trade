import React, { useState } from "react";
import { useSelector } from "react-redux";
import { PRICECOLOR } from "../utils/helpers";
import { RootState } from "../store/store";

export const PnL = () => {
  const { positions = {}, fundInfo = {} } = useSelector(
    ({ state }: RootState) => state.shoonya || {}
  );

  //   const { _shoonyaPL } = useSelector((s: RootState) => s.ticks_shoonya);

  const _shoonyaPL = 1000;

  const [showInPerc, setShowidPerc] = useState(true);

  const shoonyaPLInPerc = (
    ((_shoonyaPL ?? fundInfo.pl ?? 0) * 100) /
    (fundInfo.openBalance || 1)
  ).toFixed(2);

  const shoonyaPLInRs = _shoonyaPL ?? fundInfo.pl ?? 0;

  const brokerageInPerc = (
    (+fundInfo.brokerage * 100) /
    (fundInfo.openBalance || 1)
  ).toFixed(2);

  return (
    <div className="min-w-[140px]">
      <div className="flex items-center">
        <h3>P&L</h3>
        <h2
          className={`select-none ml-2.5 ${PRICECOLOR(shoonyaPLInPerc)}`}
          onDoubleClick={() => setShowidPerc(!showInPerc)}
        >
          {showInPerc ? shoonyaPLInPerc + "%" : shoonyaPLInRs}
        </h2>
      </div>
      <div className="flex items-center text-xs text-muted-foreground mt-1">
        brokerage: <span className="ml-2">{fundInfo.brokerage ?? 10}</span>
      </div>
    </div>
  );
};
