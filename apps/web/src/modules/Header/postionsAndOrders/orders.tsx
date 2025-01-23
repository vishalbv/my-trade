import React, { useState } from "react";
import { useSelector } from "react-redux";
import { RootState } from "../../../store/store";
import { Button } from "@repo/ui/button";
import { OrderCard } from "./OrderCard";

const statuses = [
  { value: "COMPLETE", label: "All" },
  { value: "PENDING", label: "Pending" },
  { value: "OPEN", label: "Open" },
] as const;

type Status = (typeof statuses)[number]["value"];

export const Orders: React.FC = () => {
  const orderBook = useSelector(
    (state: RootState) => state.states.shoonya?.orderBook || []
  );
  const [filter, setFilter] = useState<Status>("COMPLETE");

  const filteredOrders =
    filter === "COMPLETE"
      ? orderBook
      : orderBook.filter((order: any) => order.status === filter);

  return (
    <div className="flex-1 max-h-[200px] overflow-auto">
      <div className="flex flex-col h-full">
        <div className="flex items-center gap-2 px-2 h-8 text-xs font-medium text-muted-foreground border-b border-border bg-muted/50">
          <div className="min-w-[150px] flex-1">Instrument</div>
          <div className="w-[50px]"></div>
          <div className="min-w-[50px]">Time</div>
          <div className="min-w-[80px] text-right">Qty.</div>
          <div className="min-w-[80px] text-right">Price</div>
          <div className="w-28 ml-auto text-right">Status</div>
        </div>

        <div className="flex-1 overflow-auto">
          {filteredOrders.length > 0 ? (
            filteredOrders.map((order: any) => (
              <OrderCard key={order.norenordno} order={order} />
            ))
          ) : (
            <div className="text-[10px] text-muted-foreground text-center py-4">
              No orders yet
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
