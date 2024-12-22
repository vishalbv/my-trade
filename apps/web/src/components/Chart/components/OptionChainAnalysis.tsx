import React, { useMemo } from "react";
import { useTheme } from "next-themes";

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
  spotPrice?: number;
}

export const OptionChainAnalysis: React.FC<OptionChainAnalysisProps> = ({
  data,
  spotPrice,
}) => {
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
      <div className="grid grid-cols-3 gap-2 px-4 py-2 text-xs font-medium">
        <div className="text-right text-[#2962FF]">CE</div>
        <div className="text-center">Strike</div>
        <div className="text-[#FF2962]">PE</div>
      </div>

      {/* Data rows */}
      <div className="flex flex-col gap-1">
        {processedData.map(({ strike, ce, pe }) => (
          <div
            key={strike}
            className={`grid grid-cols-3 gap-2 px-4 py-0 text-xs ${
              spotPrice && Math.abs(strike - spotPrice) < 100
                ? "bg-background/10"
                : ""
            }`}
          >
            {/* CE Side */}
            <div className="relative h-5">
              {ce && maxOI > 0 && (
                <>
                  <div
                    className="absolute right-0 h-full bg-[#2962FF] transition-all"
                    style={{
                      width: `${((ce.oi || 0) / maxOI) * 100}%`,
                      opacity: (ce.oich || 0) > 0 ? 1 : 0.5,
                    }}
                  />
                  <span className="absolute right-1 text-white z-10 top-1/2 transform -translate-y-1/2">
                    {formatInLakhs(ce.oi)}
                  </span>
                </>
              )}
            </div>

            {/* Strike Price */}
            <div
              className={`text-center font-medium ${
                spotPrice && Math.abs(strike - spotPrice) < 100
                  ? "text-primary"
                  : ""
              }`}
            >
              {strike}
            </div>

            {/* PE Side */}
            <div className="relative h-5">
              {pe && maxOI > 0 && (
                <>
                  <div
                    className="absolute left-0 h-full bg-[#FF2962] transition-all"
                    style={{
                      width: `${((pe.oi || 0) / maxOI) * 100}%`,
                      opacity: (pe.oich || 0) > 0 ? 1 : 0.5,
                    }}
                  />
                  <span className="absolute left-1 text-white z-10 top-1/2 transform -translate-y-1/2">
                    {formatInLakhs(pe.oi)}
                  </span>
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex justify-between px-4 mt-4 text-xs">
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
      </div>
    </div>
  );
};
