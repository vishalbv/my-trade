"use client";

import { Card } from "@repo/ui/card";
import { useSelector } from "react-redux";
import { Progress } from "@repo/ui/progress";

export function RiskMetrics() {
  const { moneyManage, fundInfo } = useSelector(
    (state: any) => state.states.shoonya || {}
  );

  const maxLossAmount = moneyManage?.maxLossOfDayInRs || 0;
  const currentPL = fundInfo?.pl || 0;
  const lossPercentage = Math.abs((currentPL / maxLossAmount) * 100);

  return (
    <Card className="p-4">
      <h3 className="text-lg font-semibold mb-4">Risk Metrics</h3>
      <div className="space-y-4">
        <div>
          <div className="flex justify-between mb-2">
            <p className="text-sm text-muted-foreground">Loss Limit Usage</p>
            <p className="text-sm font-medium">{lossPercentage.toFixed(1)}%</p>
          </div>
          <Progress value={lossPercentage} className="h-2" />
        </div>
        <div>
          <div className="flex justify-between mb-2">
            <p className="text-sm text-muted-foreground">Trades Used</p>
            <p className="text-sm font-medium">
              {moneyManage?.noOfTrades || 0}/{moneyManage?.maxNoOfTrades || 0}
            </p>
          </div>
          <Progress
            value={(moneyManage?.noOfTrades / moneyManage?.maxNoOfTrades) * 100}
            className="h-2"
          />
        </div>
      </div>
    </Card>
  );
}
