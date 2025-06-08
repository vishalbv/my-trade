import { useState, useEffect } from "react";
import { OHLCData } from "../../../services/deltaExchange";
import { detectBearishContinuation } from "../strategies/bearishContinuation";

export interface Drawing {
  id: string;
  type: string;
  points: { x: number; y: number }[];
  color: string;
  symbol: string;
}

export function useStrategyDrawings(candles: OHLCData[]) {
  const [drawings, setDrawings] = useState<Drawing[]>([]);

  useEffect(() => {
    if (!candles || candles.length < 201) return;

    // Get drawings from strategy
    const bearishDrawings = detectBearishContinuation(candles);

    // Combine all strategy drawings
    setDrawings([...bearishDrawings]);
  }, [candles]);

  return {
    drawings,
    clearDrawings: () => setDrawings([]),
  };
}
