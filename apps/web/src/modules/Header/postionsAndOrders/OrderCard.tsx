import React from "react";
import moment from "moment";
import { cn } from "@repo/utils/ui/helpers";
import { PRICECOLOR } from "../../../utils/helpers";

interface OrderCardProps {
  order: any; // Type this properly based on your order structure
}

export const OrderCard: React.FC<OrderCardProps> = ({ order }) => {
  const { dname, status, trantype, norentm, qty, avgprc, rejreason } = order;

  const isRecent =
    moment(norentm, "HH:mm:ss DD-MM-YYYY").fromNow() === "a few seconds ago";

  return (
    <div
      className={cn(
        "rounded-md border border-border p-2 transition-all",
        status === "REJECTED" && "bg-destructive/10 border-destructive/50",
        status === "COMPLETE" && "bg-primary/5",
        isRecent && "animate-highlight-fade"
      )}
    >
      <div className="flex justify-between items-start">
        <div className="space-y-1">
          <DisplayName dname={dname} />
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>{moment(norentm, "HH:mm:ss DD-MM-YYYY").fromNow()}</span>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <span
            className={cn(
              "text-sm font-medium",
              PRICECOLOR(trantype === "S" ? -1 : 1)
            )}
          >
            {trantype === "S" ? "Sell" : "Buy"}
          </span>
          <span
            className={cn(
              "text-xs px-2 py-0.5 rounded-full",
              status === "COMPLETE" && "bg-primary/20 text-primary",
              status === "REJECTED" && "bg-destructive/20 text-destructive",
              status === "PENDING" && "bg-yellow-500/20 text-yellow-500"
            )}
          >
            {status}
          </span>
        </div>
      </div>

      <div className="mt-2 flex justify-between items-center">
        <span className="text-sm font-medium">
          {qty} qty @ ₹{avgprc}
        </span>
      </div>

      {rejreason && (
        <div className="mt-1 text-xs text-destructive">{rejreason}</div>
      )}
    </div>
  );
};

const DisplayName: React.FC<{ dname: string }> = ({ dname }) => {
  const parts = dname.split(" ").filter((_, k) => k !== 1);

  return (
    <div className="flex gap-1">
      {parts.map((part, index) => (
        <span
          key={index}
          className={cn("text-sm", index !== 0 && "font-medium")}
        >
          {part}
        </span>
      ))}
    </div>
  );
};
