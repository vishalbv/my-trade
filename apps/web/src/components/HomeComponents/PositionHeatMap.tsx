"use client";

import { Card } from "@repo/ui/card";
import { useSelector } from "react-redux";
import { PositionCard } from "../../modules/Header/postionsAndOrders/PositionCard";

export function PositionHeatMap() {
  const { positions = [], ticks = {} } = useSelector(
    (state: any) => state.states.shoonya || {}
  );

  // Filter only open positions (where netqty is not 0)
  const openPositions = positions.filter(
    (position: any) => parseInt(position.netqty) !== 0
  );

  if (!openPositions.length) {
    return (
      <Card className="p-4">
        <h3 className="text-lg font-semibold mb-4">Open Positions</h3>
        <p className="text-sm text-muted-foreground text-center py-8">
          No active positions
        </p>
      </Card>
    );
  }

  return (
    <Card className="p-4">
      <h3 className="text-lg font-semibold mb-4">Open Positions</h3>

      <div className="flex flex-col">
        {/* Header */}
        <div className="flex items-center gap-2 px-2 h-8 text-xs font-medium text-muted-foreground border-b border-border bg-muted/50">
          <div className="min-w-[150px] flex-1">Instrument</div>
          <div className="min-w-[40px] text-right">Qty.</div>
          <div className="min-w-[80px] text-right">LTP</div>
          <div className="w-40 text-center">Quick Order</div>
          <div className="min-w-[100px] text-right">P&L</div>
        </div>

        {/* Position Cards */}
        <div className="flex-1 overflow-auto">
          {openPositions.map((position: any) => (
            <PositionCard
              key={position.token}
              position={position}
              tick={ticks[position.token]}
              onOrderPlace={() => {}} // Add proper handler if needed
            />
          ))}
        </div>
      </div>
    </Card>
  );
}
