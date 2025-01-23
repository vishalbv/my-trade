import React, { useMemo, useState } from "react";
import { useTheme } from "next-themes";
import { cn } from "@repo/utils/ui/helpers";
import { updateChartLayout } from "../../../store/slices/globalChartSlice";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../../../store/store";
import { PRICECOLOR } from "../../../utils/helpers";

interface OptionChainData {
  ask: number;
  bid: number;
  fyToken: string;
  ltp: number;
  ltpch: number;
  ltpchp: number;
  oi: number;
  oich: number;
  oichp: number;
  option_type: "CE" | "PE";
  prev_oi: number;
  strike_price: number;
  symbol: string;
  volume: number;
}

interface OptionChainAnalysisProps {
  data: OptionChainData[];
}

export const OptionChainAnalysis: React.FC<OptionChainAnalysisProps> = ({
  data,
}) => {
  const [hoveredStrikeIndexes, setHoveredStrikeIndexes] = useState<number[]>(
    []
  );

  const {
    [0]: selectedCE,
    [1]: selectedMainSymbol,
    [2]: selectedPE,
  } = useSelector((state: RootState) => state.globalChart.optionsChartLayouts);

  const dispatch = useDispatch();

  // Process and group data by strike price
  const processedData = useMemo(() => {
    if (!data || data.length === 0) return [];

    const strikeMap = new Map<
      number,
      { ce?: OptionChainData; pe?: OptionChainData }
    >();

    data.forEach((item) => {
      if (!item) return;
      const existing = strikeMap.get(item.strike_price) || {};
      if (item.option_type === "CE") {
        existing.ce = item;
      } else {
        existing.pe = item;
      }
      strikeMap.set(item.strike_price, existing);
    });

    // Convert to array and sort by strike price
    return Array.from(strikeMap.entries())
      .sort(([a], [b]) => a - b)
      .map(([strike, data]) => ({ strike, ...data }));
  }, [data]);

  const onStrikeClick = (indexes: number[]) => {
    const [peIndex, ceIndex] = [...indexes].sort((a, b) => a - b);
    const middleCE = processedData[ceIndex as any]?.ce!;
    const middlePE = processedData[peIndex as any]?.pe!;

    dispatch(
      updateChartLayout({
        layoutTypeKey: "optionsChartLayouts",
        "0": {
          symbol: middleCE.symbol,
          timeframe: "1",
          symbolInfo: {
            ...middleCE,
            expiryDate: selectedMainSymbol.symbolInfo.expiryDate,
            lotSize: selectedMainSymbol.symbolInfo.lotSize,
          },
        },
        "2": {
          symbol: middlePE.symbol,
          timeframe: "1",
          symbolInfo: {
            ...middlePE,
            expiryDate: selectedMainSymbol.symbolInfo.expiryDate,
            lotSize: selectedMainSymbol.symbolInfo.lotSize,
          },
        },
      })
    );
  };

  // Calculate max OI for scaling
  const maxOI = useMemo(() => {
    if (!data || data.length === 0) return 0;
    return Math.max(...data.map((item) => item?.oi || 0));
  }, [data]);

  // Helper function to format numbers in lakhs
  const formatInLakhs = (value: number): string => {
    return `${(value / 100000).toFixed(2)}L`;
  };

  if (!data || data.length === 0) {
    return <div>No data available</div>;
  }

  return (
    <div className="flex flex-col w-full">
      {/* Headers */}

      <div className="grid grid-cols-[1fr_auto_1fr] gap-2 px-4 py-2 text-md font-medium">
        <div className={cn("text-right", PRICECOLOR(1))}>CE</div>
        <div className="text-center px-2">Strike</div>
        <div className={cn(PRICECOLOR(-1))}>PE</div>
      </div>

      {/* Data rows */}
      <div className="flex flex-col gap-1">
        {processedData.map(({ strike, ce, pe }, index) => (
          <div
            key={strike}
            className={`grid grid-cols-[1fr_auto_1fr] gap-0 px-4 py-0 text-xs`}
          >
            {/* CE Side */}
            <div className="relative h-5">
              {ce && maxOI > 0 && (
                <>
                  <div
                    className={cn(
                      "absolute right-0 h-full transition-all",
                      "bg-green-500 dark:bg-green-800"
                    )}
                    style={{
                      width: `${((ce.oi || 0) / maxOI) * 100}%`,
                      opacity: (ce.oich || 0) > 0 ? 1 : 0.5,
                    }}
                  />
                  <span className="absolute right-1 z-10 top-1/2 transform -translate-y-1/2">
                    {formatInLakhs(ce.oi)}
                  </span>
                </>
              )}
            </div>

            {/* Strike Price */}
            <div
              className={cn(
                "text-center font-medium px-4 cursor-pointer",
                ce?.symbol === selectedCE?.symbol ||
                  pe?.symbol === selectedPE?.symbol
                  ? "bg-primary text-black"
                  : "",
                hoveredStrikeIndexes.includes(index)
                  ? "bg-primary/80 text-black"
                  : ""
              )}
              onMouseEnter={() =>
                setHoveredStrikeIndexes([
                  index,
                  processedData.length - 1 - index,
                ])
              }
              onMouseLeave={() => setHoveredStrikeIndexes([])}
              onClick={() =>
                onStrikeClick([index, processedData.length - 1 - index])
              }
            >
              {strike}
            </div>

            {/* PE Side */}
            <div className="relative h-5">
              {pe && maxOI > 0 && (
                <>
                  <div
                    className={cn(
                      "absolute left-0 h-full transition-all",
                      "bg-destructive dark:bg-red-600"
                    )}
                    style={{
                      width: `${((pe.oi || 0) / maxOI) * 100}%`,
                      opacity: (pe.oich || 0) > 0 ? 1 : 0.5,
                    }}
                  />
                  <span className="absolute left-1 z-10 top-1/2 transform -translate-y-1/2">
                    {formatInLakhs(pe.oi)}
                  </span>
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Legend */}
      {/* <div className="flex justify-between px-4 mt-4 text-xs">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-[#2962FF] opacity-100" />
            <span>OI Buildup</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-[#2962FF] opacity-50" />
            <span>OI Unwinding</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-[#FF2962] opacity-100" />
            <span>OI Buildup</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-[#FF2962] opacity-50" />
            <span>OI Unwinding</span>
          </div>
        </div>
      </div> */}
    </div>
  );
};
