import React, { useState } from "react";
import { useSelector } from "react-redux";
import { RootState } from "../../../store/store";
import { PositionCard } from "./PositionCard";
import { placeOrder } from "../../../store/actions/orderActions";

export const Positions: React.FC = () => {
  const positions = useSelector(
    (state: RootState) => state.states.shoonya?.positions || []
  );
  const ticks = useSelector((state: RootState) => state.ticks.shoonya_server);

  const handleOrderPlace = ({ position, qty, limitPrice, side }: any) => {
    placeOrder({
      broker: "shoonya",
      qty: qty || position.netqty,
      side: side,
      frzqty: +position.frzqty,
      type: 2,
      exchange: position.exch,
      price: limitPrice,
      shoonyaSymbol: position.tsym,
    });
  };

  return (
    <div className="flex-1 overflow-auto">
      <div className="flex flex-col h-full">
        <div className="flex items-center gap-2 px-2 h-8 text-xs font-medium text-muted-foreground border-b border-border bg-muted/50">
          <div className="min-w-[150px] flex-1">Instrument</div>
          <div className="min-w-[40px] text-right">Qty.</div>
          <div className="min-w-[80px] text-right">LTP</div>
          <div className="w-40 ml-auto text-center">Actions</div>
          <div className="min-w-[100px] text-right">P&L</div>
        </div>

        <div className="flex-1 overflow-auto">
          {positions.length > 0 ? (
            positions.map((position: any) => (
              <PositionCard
                key={position.token}
                position={position}
                tick={ticks[position.token]}
                onOrderPlace={handleOrderPlace}
              />
            ))
          ) : (
            <div className="text-[10px] text-muted-foreground text-center py-4">
              No positions yet
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
