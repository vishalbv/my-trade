import React from "react";
import { useSelector } from "react-redux";
import { RootState } from "../../../store/store";

interface Order {
  tradingSymbol: string;
  status: string;
  price: number;
  quantity?: number;
}

export const Orders: React.FC = () => {
  const orders = useSelector<RootState, Order[]>(
    (state) => state.states.shoonya?.orders || []
  );

  return (
    <div className="space-y-2 w-full">
      {orders.map((order: Order, index: number) => (
        <div key={index} className="p-2 rounded-md border border-border">
          <div className="text-sm">{order.tradingSymbol}</div>
          <div className="text-xs text-muted-foreground">
            Status: {order.status} | Price: {order.price}
          </div>
        </div>
      ))}
      {orders.length === 0 && (
        <div className="text-sm text-muted-foreground h-full w-full flex items-center justify-center">
          No orders found
        </div>
      )}
    </div>
  );
};
