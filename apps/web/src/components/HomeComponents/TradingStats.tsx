"use client";

import { Card } from "@repo/ui/card";
import { useSelector } from "react-redux";

export function TradingStats() {
  const {
    noOfTrades,
    winningTrades = 0,
    losingTrades = 0,
  } = useSelector((state: any) => state.states.shoonya || {});

  const winRate = (winningTrades / (winningTrades + losingTrades)) * 100 || 0;

  return (
    <Card className="p-4">
      <h3 className="text-lg font-semibold mb-4">Trading Statistics</h3>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-sm text-muted-foreground">Total Trades</p>
          <p className="text-xl font-bold">{noOfTrades}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Win Rate</p>
          <p className="text-xl font-bold text-green-500">
            {winRate.toFixed(1)}%
          </p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Winning Trades</p>
          <p className="text-xl font-bold text-green-500">{winningTrades}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Losing Trades</p>
          <p className="text-xl font-bold text-red-500">{losingTrades}</p>
        </div>
      </div>
    </Card>
  );
}
