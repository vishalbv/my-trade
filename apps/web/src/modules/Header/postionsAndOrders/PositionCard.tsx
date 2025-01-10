import React, { useEffect, useState } from "react";
import { cn } from "@repo/utils/ui/helpers";
import { DisplayName } from "./components";
import { Button } from "@repo/ui/button";
import { Input } from "@repo/ui/input";
import { PRICECOLOR } from "../../../utils/helpers";
import { getCurrentShoonyaPositionPL } from "@repo/utils/helpers";

interface PositionCardProps {
  position: any;
  tick?: {
    lp?: number;
    c?: number;
    pc?: number;
  };
  onOrderPlace: ({
    position,
    side,
    qty,
    limitPrice,
  }: {
    position: any;
    side: 1 | -1;
    qty?: number;
    limitPrice?: number;
  }) => void;
}

export const PositionCard: React.FC<PositionCardProps> = ({
  position,
  tick,
  onOrderPlace,
}) => {
  const { dname, netqty, token, avgprc = 0, exch, tsym } = position;
  const pnl = getCurrentShoonyaPositionPL(position, tick?.lp || 0);
  const [inputs, setInputs] = useState<{ price?: string; qty?: number }>({});

  const handleInputChange = (values: { price?: string; qty?: number }) => {
    setInputs((prev: any) => ({
      ...prev,
      ...values,
    }));
  };

  useEffect(() => {
    handleInputChange({ qty: netqty });
  }, [netqty]);

  return (
    <div className="flex items-center justify-between px-2 h-9 text-xs border-b border-border hover:bg-muted/30">
      <div className="flex items-center gap-2 w-full">
        <div className="min-w-[150px] flex-1 flex items-center gap-2">
          <DisplayName dname={dname} tsym={tsym} />
          <span className="px-1.5 py-0.5 rounded-sm bg-muted/50 text-[9px]">
            {exch}
          </span>
        </div>
        <div
          className={cn(
            "min-w-[40px] text-right tabular-nums",
            PRICECOLOR(netqty)
          )}
        >
          {netqty}
        </div>
        <div className="min-w-[80px] text-right tabular-nums">
          {tick?.lp || 0}
        </div>

        <div className="flex items-stretch gap-0.5 ml-auto h-full py-0.5 w-40">
          <div className="relative flex-1">
            <Input
              type="number"
              value={inputs?.qty || ""}
              onChange={(e) => handleInputChange({ qty: +e.target.value })}
              className="mr-2 ml-2 h-full w-16 text-[12px] px-1 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none text-center"
              step={position.ls}
            />
          </div>
          <div className="flex gap-0.5 w-full">
            <Button
              size="sm"
              variant="outline"
              className="h-full w-1/2 p-0 text-[10px] bg-green-500/20 hover:bg-green-500/30 hover:text-green-500 hover:border-green-500/50"
              onDoubleClick={() =>
                onOrderPlace({ position, side: 1, qty: inputs?.qty })
              }
            >
              B
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-full w-1/2 p-0 text-[10px] bg-red-500/20 hover:bg-red-500/30 hover:text-red-500 hover:border-red-500/50"
              onDoubleClick={() =>
                onOrderPlace({ position, side: -1, qty: inputs?.qty })
              }
            >
              S
            </Button>
          </div>
        </div>
        <div
          className={cn(
            "min-w-[100px] text-right font-medium tabular-nums",
            PRICECOLOR(pnl)
          )}
        >
          {pnl.toFixed(2)}
        </div>
      </div>
    </div>
  );
};
