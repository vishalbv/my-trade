import React from "react";
import { useSelector } from "react-redux";
import { RootState } from "../../../store/store";

interface Position {
  tradingSymbol: string;
  netQuantity: number;
  lastPrice: number;
  pnl?: number;
}

export const Positions: React.FC = () => {
  const positions = useSelector<RootState, Position[]>(
    (state) => state.states.shoonya?.positions || []
  );

  return (
    <div className="space-y-2 w-full max-h-[200px] overflow-auto">
      {positions.map((position: Position, index: number) => (
        <div key={index} className="p-2 rounded-md border border-border">
          <div className="text-sm">{position.tradingSymbol}</div>
          <div className="text-xs text-muted-foreground">
            Qty: {position.netQuantity} | LTP: {position.lastPrice}
          </div>
        </div>
      ))}
      {positions.length === 0 && (
        <div className="text-sm text-muted-foreground h-full w-full flex items-center justify-center">
          No positions found
        </div>
      )}
    </div>
  );
};
