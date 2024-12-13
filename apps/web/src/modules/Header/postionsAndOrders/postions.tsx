import React, { useState } from "react";
import { useSelector } from "react-redux";
import { RootState } from "../../../store/store";
import { PositionCard } from "./PositionCard";

export const Positions: React.FC = () => {
  const positions = useSelector(
    (state: RootState) => state.states.shoonya?.positions || []
  );
  const ticks = useSelector((state: RootState) => state.ticks.shoonya_server);
  const [inputs, setInputs] = useState<
    Record<string, { price?: string; qty?: string }>
  >({});

  const handleInputChange = (
    token: string,
    values: { price?: string; qty?: string }
  ) => {
    setInputs((prev) => ({
      ...prev,
      [token]: { ...prev[token], ...values },
    }));
  };

  const handleOrderPlace = (position: any, side: 1 | -1) => {
    // Implement your order placement logic here
    console.log("Place order", position, side);
  };

  return (
    <div className="flex-1 max-h-[200px] overflow-auto">
      <div className="flex flex-col h-full">
        <div className="flex items-center gap-2 px-2 h-8 text-xs font-medium text-muted-foreground border-b border-border bg-muted/50">
          <div className="min-w-[150px] flex-1">Instrument</div>
          <div className="min-w-[80px] text-right">Qty.</div>
          <div className="min-w-[80px] text-right">LTP</div>
          <div className="w-40 ml-auto text-center">Actions</div>
          <div className="min-w-[100px] text-right">P&L</div>
        </div>

        <div className="flex-1 overflow-auto">
          {positions.length > 0 ? (
            positions.map((position) => (
              <PositionCard
                key={position.token}
                position={position}
                tick={ticks[position.token]}
                onOrderPlace={handleOrderPlace}
                onInputChange={handleInputChange}
                inputs={inputs}
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
