import React from "react";
import { cn } from "@repo/utils/ui/helpers";
import { DisplayName } from "./components";
import { Button } from "@repo/ui/button";
import { Input } from "@repo/ui/input";
import { PRICECOLOR } from "../../../utils/helpers";

interface PositionCardProps {
  position: any;
  tick?: {
    lp?: number;
    c?: number;
    pc?: number;
  };
  onOrderPlace: (position: any, side: 1 | -1) => void;
  onInputChange: (
    token: string,
    values: { price?: string; qty?: string }
  ) => void;
  inputs: Record<string, { price?: string; qty?: string }>;
}

export const getCurrentValue = (i: any, lp: any) => {
  return +i.rpnl + +i.netqty * (lp - +i.netavgprc) * +i.prcftr;
};

export const PositionCard: React.FC<PositionCardProps> = ({
  position,
  tick,
  onOrderPlace,
  onInputChange,
  inputs,
}) => {
  const { dname, netqty, token, avgprc = 0, exch, tsym } = position;
  const pnl = getCurrentValue(position, tick?.lp || 0);

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
            "min-w-[80px] text-right tabular-nums",
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
              value={inputs[token]?.qty || ""}
              onChange={(e) => onInputChange(token, { qty: e.target.value })}
              className="mr-2 ml-2 h-full w-16 text-[12px] px-1 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none text-center"
              step={15}
            />
          </div>
          <div className="flex gap-0.5 w-full">
            <Button
              size="sm"
              variant="outline"
              className="h-full w-1/2 p-0 text-[10px] hover:bg-green-500/50 hover:text-green-500 hover:border-green-500"
              onDoubleClick={() => onOrderPlace(position, 1)}
            >
              B
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-full w-1/2 p-0 text-[10px] hover:bg-red-500/10 hover:text-red-500 hover:border-red-500"
              onDoubleClick={() => onOrderPlace(position, -1)}
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
