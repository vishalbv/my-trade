import React from "react";
import { useSelector } from "react-redux";
import { RootState } from "../../../store/store";
import { Card } from "@repo/ui/card";
import { OrderCard } from "./OrderCard";

export const Orders: React.FC = () => {
  const orderBook = useSelector(
    (state: RootState) => state.states.shoonya?.orderBook || []
  );

  // Filter only open and pending orders
  const openOrders = orderBook.filter(
    (order) => order.status === "OPEN" || order.status === "PENDING"
  );

  if (!openOrders.length) {
    return (
      <Card className="p-4">
        <h3 className="text-lg font-semibold mb-4">Open Orders</h3>
        <p className="text-sm text-muted-foreground text-center py-8">
          No open orders
        </p>
      </Card>
    );
  }

  return (
    <Card className="p-4">
      <h3 className="text-lg font-semibold mb-4">Open Orders</h3>
      <div className="flex flex-col">
        <div className="flex items-center gap-2 px-2 h-8 text-xs font-medium text-muted-foreground border-b border-border bg-muted/50">
          <div className="min-w-[150px] flex-1">Instrument</div>
          <div className="w-[50px]">Side</div>
          <div className="min-w-[50px]">Time</div>
          <div className="min-w-[80px] text-right">Qty.</div>
          <div className="min-w-[80px] text-right">Price</div>
          <div className="w-28 ml-auto text-right">Status</div>
        </div>

        <div className="flex-1 overflow-auto">
          {openOrders.map((order) => (
            <OrderCard key={order.norenordno} order={order} />
          ))}
        </div>
      </div>
    </Card>
  );
};
