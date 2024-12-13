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
    (state: RootState) => state.states.shoonya?.orders || []
  );
  const [filter, setFilter] = useState<Status>("COMPLETE");

  const filteredOrders =
    filter === "COMPLETE"
      ? orderBook
      : orderBook.filter((order) => order.status === filter);

  return (
    <div className="flex-1 h-full">
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between px-2 py-1 border-b border-border">
          <span className="text-sm font-medium">
            Orders (
            {orderBook.filter((i) => i.status === "COMPLETE").length || 0})
          </span>
          <div className="flex gap-1">
            {statuses.map((status) => (
              <Button
                key={status.value}
                variant={filter === status.value ? "secondary" : "ghost"}
                size="sm"
                className="text-xs h-7"
                onClick={() => setFilter(status.value)}
              >
                {status.label}
              </Button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-auto space-y-2 p-2">
          {filteredOrders.map((order) => (
            <OrderCard key={order.norenordno} order={order} />
          ))}
        </div>
      </div>
    </div>
  );
};
