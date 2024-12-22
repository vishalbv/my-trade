"use client";
import React, { useEffect, useState, useRef } from "react";
import {
  OptionsAnalyzer,
  OptionsAnalyzerExample,
} from "../../components/Chart/components/OptionsAnalyzer";
import { useSelector } from "react-redux";
import { RootState } from "../../store/store";
import { findNearbyExpiries } from "../../utils/helpers";
import { fetchOptionDetails } from "../../store/actions/helperActions";
import { indexNamesTofyersIndexMapping } from "@repo/utils/helpers";
import { useRealtimeCandles } from "../../components/Chart/hooks/useRealtimeCandles";
import {
  transformPriceData,
  transformPercentageChangeData,
  transformRelativeMovement,
  transformPremiumIndexCorrelation,
} from "../../components/Chart/utils/chartTransformations";
import { MultiSeriesChart } from "../../components/Chart/components/MultiSeriesChart";
import { LightweightChart } from "../../components/Chart/components/LightweightChart";
import { OptionChainAnalysis } from "../../components/Chart/components/OptionChainAnalysis";

export const OptionsAnalyzerWindow: React.FC = () => {
  const { upcomingExpiryDates = {} } = useSelector(
    (state: RootState) => state.states.app
  );

  const [symbols, setSymbols] = useState<{ symbol: string }[]>([]);
  const [optionChainData, setOptionChainData] = useState<
    OptionChainData[] | null
  >(null);

  useEffect(() => {
    const getOptionDetails = async () => {
      const nearbyExpiries = findNearbyExpiries(upcomingExpiryDates);

      if (nearbyExpiries?.[0]) {
        const [date, symbol] = nearbyExpiries[0];
        const { middleCE, middlePE, optionChainData } =
          (await fetchOptionDetails(
            indexNamesTofyersIndexMapping(symbol),
            date
          )) || {};
        setOptionChainData(optionChainData);
        setSymbols([
          { symbol: middleCE.symbol },
          { symbol: indexNamesTofyersIndexMapping(symbol) },
          { symbol: middlePE.symbol },
        ]);
      }
    };
    getOptionDetails();
  }, [upcomingExpiryDates]);
  console.log(symbols, "symbols");

  return (
    <div className="flex-1 p-4 h-full w-full">
      {symbols[0]?.symbol && (
        <ChartWithData symbols={symbols} optionChainData={optionChainData} />
      )}
    </div>
  );
};

const ChartWithData = ({
  symbols,
  optionChainData,
}: {
  symbols: { symbol: string }[];
  optionChainData: OptionChainData[] | null;
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);

  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        const newWidth = containerRef.current.clientWidth;
        setContainerWidth(newWidth);
        console.log("Container width updated:", newWidth); // Debug log
      }
    };

    // Initial width
    updateWidth();

    // Update width on window resize
    window.addEventListener("resize", updateWidth);

    // Optional: Add ResizeObserver for more precise updates
    const resizeObserver = new ResizeObserver(updateWidth);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => {
      window.removeEventListener("resize", updateWidth);
      resizeObserver.disconnect();
    };
  }, []);

  const [selectedTransformation, setSelectedTransformation] = useState<
    "percentage" | "price" | "relative" | "correlation"
  >("percentage");

  const { chartData: chartDataCE } = useRealtimeCandles({
    symbol: symbols[0]?.symbol,
    timeframe: "1",
    requestTicksSubscription: true,
  });
  const { chartData: chartDataMain } = useRealtimeCandles({
    symbol: symbols[1]?.symbol,
    timeframe: "1",
    requestTicksSubscription: true,
  });
  const { chartData: chartDataPE } = useRealtimeCandles({
    symbol: symbols[2]?.symbol,
    timeframe: "1",
    requestTicksSubscription: true,
  });

  // Get data for all transformations
  const percentageData = [
    transformPercentageChangeData(chartDataCE, "#2962FF", "CE %"),
    transformPercentageChangeData(chartDataMain, "#FF2962", "Index %"),
    transformPercentageChangeData(chartDataPE, "#29FF62", "PE %"),
  ].filter(Boolean);

  const priceData = [
    transformPriceData(chartDataCE, "#2962FF", "CE"),
    // transformPriceData(chartDataMain, "#FF2962", "Index"),
    transformPriceData(chartDataPE, "#29FF62", "PE"),
  ].filter(Boolean);

  const relativeMovementData = transformRelativeMovement({
    ceData: chartDataCE || [],
    peData: chartDataPE || [],
    indexData: chartDataMain || [],
  });

  const correlationData = transformPremiumIndexCorrelation({
    ceData: chartDataCE || [],
    peData: chartDataPE || [],
    indexData: chartDataMain || [],
  });

  console.log(correlationData, "correlationData");
  const getTransformedData = () => {
    switch (selectedTransformation) {
      case "percentage":
        return percentageData;
      case "price":
        return priceData;
      case "relative":
        return relativeMovementData;
      case "correlation":
        return correlationData;
      default:
        return percentageData;
    }
  };

  return (
    <div className="flex flex-col gap-4 h-full">
      {/* Transformation selector chips */}
      <div className="flex gap-2 p-2">
        <button
          onClick={() => setSelectedTransformation("percentage")}
          className={`px-3 py-1 rounded-full text-sm ${
            selectedTransformation === "percentage"
              ? "bg-primary text-white"
              : "bg-background/50 text-foreground/60"
          }`}
        >
          Percentage Change
        </button>
        <button
          onClick={() => setSelectedTransformation("price")}
          className={`px-3 py-1 rounded-full text-sm ${
            selectedTransformation === "price"
              ? "bg-primary text-white"
              : "bg-background/50 text-foreground/60"
          }`}
        >
          Price
        </button>
        <button
          onClick={() => setSelectedTransformation("relative")}
          className={`px-3 py-1 rounded-full text-sm ${
            selectedTransformation === "relative"
              ? "bg-primary text-white"
              : "bg-background/50 text-foreground/60"
          }`}
        >
          Relative Movement
        </button>
        <button
          onClick={() => setSelectedTransformation("correlation")}
          className={`px-3 py-1 rounded-full text-sm ${
            selectedTransformation === "correlation"
              ? "bg-primary text-white"
              : "bg-background/50 text-foreground/60"
          }`}
        >
          Premium Correlation
        </button>
      </div>

      {/* <OptionsAnalyzerExample /> */}

      {/* Chart with selected transformation */}
      <div className="flex-1" style={{ height: "550px" }} ref={containerRef}>
        <LightweightChart
          width={containerWidth}
          height={400}
          series={getTransformedData()}
        />
      </div>

      {optionChainData && (
        <div className="mt-4">
          <h3 className="text-lg font-semibold mb-2">Option Chain Analysis</h3>
          <OptionChainAnalysis
            data={optionChainData.data}
            spotPrice={chartDataMain?.[chartDataMain.length - 1]?.close}
          />
        </div>
      )}
    </div>
  );
};
