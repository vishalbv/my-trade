import React, { useState } from "react";
import { useSelector } from "react-redux";
import { PRICECOLOR } from "../utils/helpers";
import { RootState } from "../store/store";

export const PnL = () => {
  const { positions = {}, fundInfo = {} } = useSelector(
    ({ states }: RootState) => states.shoonya || {}
  );

  const { _shoonyaPL } = useSelector((s: RootState) => s.ticks.shoonya_server);

  // const _shoonyaPL = 1000;

  const [showInPerc, setShowidPerc] = useState(true);

  const shoonyaPLInPerc = fundInfo.openBalance
    ? (((_shoonyaPL ?? fundInfo.pl ?? 0) * 100) / fundInfo.openBalance).toFixed(
        2
      )
    : 0;

  const shoonyaPLInRs = _shoonyaPL ?? fundInfo.pl ?? 0;

  const brokerageInPerc = fundInfo.openBalance
    ? ((+fundInfo.brokerage * 100) / (fundInfo.openBalance || 1)).toFixed(2)
    : 0;

  return (
    <div
      className="min-w-[140px] select-none"
      onDoubleClick={(e) => {
        e.stopPropagation();
        setShowidPerc(!showInPerc);
      }}
    >
      <div className="flex items-center">
        <h3>{showInPerc ? "ROI" : "P&L"}</h3>
        <h2 className={`select-none ml-2.5 ${PRICECOLOR(shoonyaPLInPerc)}`}>
          {showInPerc ? shoonyaPLInPerc + "%" : shoonyaPLInRs}
        </h2>
      </div>
      <div className="flex items-center text-xs text-muted-foreground mt-1">
        brokerage:{" "}
        <span className="ml-2">
          {showInPerc ? brokerageInPerc + "%" : (fundInfo.brokerage ?? 0)}
        </span>
      </div>
    </div>
  );
};
