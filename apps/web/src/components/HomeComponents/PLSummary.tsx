"use client";

import { Card } from "@repo/ui/card";
import { useSelector } from "react-redux";

export function PLSummary() {
  const { fundInfo } = useSelector((state: any) => state.states.shoonya || {});
  const { _shoonyaPL } = useSelector(
    (state: any) => state.ticks.shoonya_server || {}
  );
  const pl = _shoonyaPL || fundInfo?.pl || 0;

  return (
    <Card className="p-4">
      <h3 className="text-lg font-semibold mb-4">Today's P&L Summary</h3>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-sm text-muted-foreground">Net P&L</p>
          <p
            className={`text-xl font-bold ${pl >= 0 ? "text-green-500" : "text-red-500"}`}
          >
            ₹{pl.toFixed(2)}
          </p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">ROI</p>
          <p
            className={`text-xl font-bold ${pl >= 0 ? "text-green-500" : "text-red-500"}`}
          >
            {pl && fundInfo?.openBalance
              ? ((pl / fundInfo?.openBalance) * 100).toFixed(2)
              : "0.00"}
            %
          </p>
        </div>
      </div>
    </Card>
  );
}
