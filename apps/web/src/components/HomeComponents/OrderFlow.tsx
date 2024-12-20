"use client";

import { Card } from "@repo/ui/card";
import { useSelector } from "react-redux";
import moment from "moment";
import { ScrollArea } from "@repo/ui/scroll-area";

interface Order {
  norenordno: string;
  tsym: string;
  qty: string;
  prc: string;
  status: string;
  orderdtm: string;
  buy_or_sell: string;
}

export function OrderFlow() {
  const { orderBook = [] } = useSelector(
    (state: any) => state.states.shoonya || {}
  );

  const getStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case "COMPLETE":
        return "text-green-500";
      case "REJECTED":
        return "text-red-500";
      case "PENDING":
        return "text-yellow-500";
      default:
        return "text-blue-500";
    }
  };

  return (
    <Card className="p-4">
      <h3 className="text-lg font-semibold mb-4">Recent Orders</h3>
      <ScrollArea className="h-[300px]">
        <div className="space-y-3">
          {orderBook.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No recent orders
            </p>
          ) : (
            orderBook.map((order: Order) => (
              <div
                key={order.norenordno}
                className="flex items-center justify-between p-3 bg-card/50 rounded-lg"
              >
                <div>
                  <p className="font-medium">{order.tsym}</p>
                  <p className="text-sm text-muted-foreground">
                    {moment(order.orderdtm).format("HH:mm:ss")}
                  </p>
                </div>
                <div className="text-right">
                  <p
                    className={
                      order.buy_or_sell === "B"
                        ? "text-green-500"
                        : "text-red-500"
                    }
                  >
                    {order.buy_or_sell === "B" ? "BUY" : "SELL"} {order.qty}
                  </p>
                  <p className={`text-sm ${getStatusColor(order.status)}`}>
                    {order.status}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </Card>
  );
}
