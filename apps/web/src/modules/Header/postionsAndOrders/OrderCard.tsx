import React from "react";
import { cn } from "@repo/utils/ui/helpers";
import { DisplayName } from "./components";
import moment from "moment";
import { PRICECOLOR } from "../../../utils/helpers";

interface OrderCardProps {
  order: any;
}

export const OrderCard: React.FC<OrderCardProps> = ({ order }) => {
  const {
    dname,
    status,
    trantype,
    norentm,
    qty,
    avgprc,
    prc,
    prd = "CNC",
    exch,
    tsym,
  } = order;

  return (
    <div className="flex items-center justify-between px-2 h-9 text-xs border-b border-border hover:bg-muted/30">
      <div className="flex items-center gap-2 w-full">
        <div className="min-w-[150px] flex-1 flex items-center gap-2">
          <DisplayName dname={dname} tsym={tsym} />
          <span className="px-1.5 py-0.5 rounded-sm bg-muted/50 text-[9px]">
            {exch}
          </span>
        </div>
        <div className="w-[50px]">
          <span
            className={cn(
              "px-1.5 py-0.5 rounded-sm",
              trantype === "S"
                ? "bg-red-500/10 text-red-500"
                : "bg-green-500/10 text-green-500"
            )}
          >
            {trantype === "S" ? "SELL" : "BUY"}
          </span>
        </div>
        <div className="min-w-[50px] tabular-nums">
          {moment(norentm, "HH:mm:ss DD-MM-YYYY").format("HH:mm:ss")}
        </div>
        <div className="min-w-[80px] text-right tabular-nums">{qty}</div>
        <div className="min-w-[80px] text-right tabular-nums">
          {avgprc || prc}
        </div>
        <div className="flex items-center gap-2 ml-auto w-28 justify-end">
          {status !== "COMPLETE" && (
            <span
              className={cn(
                "px-1.5 py-0.5 rounded-sm",
                status === "REJECTED" && "bg-destructive/20 text-destructive",
                status === "PENDING" && "bg-yellow-500/20 text-yellow-500",
                status === "OPEN" && "bg-blue-500/20 text-blue-500"
              )}
            >
              {status}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
