"use client";

import { Card } from "@repo/ui/card";
import { useSelector } from "react-redux";
import { ScrollArea } from "@repo/ui/scroll-area";
import { OrderCard } from "../../modules/Header/postionsAndOrders/OrderCard";

export function OpenOrders() {
  const orderBook = useSelector(
    (state: any) => state.states.shoonya?.orderBook || []
  );

  const openOrders = orderBook.filter(
    (order: any) => order.status === "OPEN" || order.status === "PENDING"
  );

  return (
    <Card className="p-4">
      <h3 className="text-lg font-semibold mb-4">Open Orders</h3>
      <ScrollArea className="h-[200px]">
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
            {openOrders.length > 0 ? (
              openOrders.map((order: any) => (
                <OrderCard key={order.norenordno} order={order} />
              ))
            ) : (
              <div className="text-sm text-muted-foreground text-center py-8">
                No open orders
              </div>
            )}
          </div>
        </div>
      </ScrollArea>
    </Card>
  );
}
