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
import { useTheme } from "next-themes";
import { themes } from "../../components/Chart/constants/themes";
import {
  PercentIcon,
  LineChartIcon,
  ArrowUpDownIcon,
  NetworkIcon,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@repo/ui/tooltip";
import { cn } from "@repo/utils/ui/helpers";

// Define transformations data
const transformations = [
  {
    id: "correlation",
    label: "Premium Correlation",
    icon: NetworkIcon,
  },
  {
    id: "percentage",
    label: "Percentage Change",
    icon: PercentIcon,
  },
  {
    id: "price",
    label: "Price",
    icon: LineChartIcon,
  },
  {
    id: "relative",
    label: "Relative Movement",
    icon: ArrowUpDownIcon,
  },
] as const;

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
    <div className="flex-1 h-full w-full p-1">
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
  const { theme } = useTheme();
  const currentTheme = themes[theme as keyof typeof themes] || themes.light;

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
  >("correlation");

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
    transformPercentageChangeData(chartDataCE, currentTheme.upColor, "CE %"),
    transformPercentageChangeData(chartDataMain, currentTheme.text, "Index %"),
    transformPercentageChangeData(chartDataPE, currentTheme.downColor, "PE %"),
  ].filter(Boolean);

  const priceData = [
    transformPriceData(chartDataCE, currentTheme.upColor, "CE"),
    // transformPriceData(chartDataMain, "#FF2962", "Index"),
    transformPriceData(chartDataPE, currentTheme.downColor, "PE"),
  ].filter(Boolean);

  const relativeMovementData = transformRelativeMovement({
    ceData: chartDataCE || [],
    peData: chartDataPE || [],
    indexData: chartDataMain || [],
    currentTheme,
  });

  const correlationData = transformPremiumIndexCorrelation({
    ceData: chartDataCE || [],
    peData: chartDataPE || [],
    indexData: chartDataMain || [],
    currentTheme,
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

  const series = getTransformedData() || [];

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      {/* Transformation selector chips */}
      <div className="flex p-2 pb-0 gap-2">
        <TooltipProvider>
          {transformations.map(({ id, label, icon: Icon }) => (
            <Tooltip key={id}>
              <TooltipTrigger asChild>
                <button
                  onClick={() => setSelectedTransformation(id)}
                  className={cn(
                    "p-2 rounded-full hover:bg-muted/70 transition-colors",
                    selectedTransformation === id
                      ? "!bg-primary text-black"
                      : "bg-background/50 text-foreground/60"
                  )}
                >
                  <Icon className="w-4 h-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{label}</p>
              </TooltipContent>
            </Tooltip>
          ))}
        </TooltipProvider>
      </div>

      {/* <OptionsAnalyzerExample /> */}

      {/* Chart with selected transformation */}
      <div className="flex-1" style={{ height: "550px" }} ref={containerRef}>
        {series[0] && (
          <LightweightChart
            width={containerWidth}
            height={400}
            series={series}
            legendEnabled={false}
          />
        )}
      </div>

      {optionChainData?.data && (
        <div className="mt-4">
          <OptionChainAnalysis
            data={optionChainData?.data?.slice(
              1,
              optionChainData?.data?.length
            )}
            spotPrice={chartDataMain?.[chartDataMain.length - 1]?.close}
          />
        </div>
      )}
    </div>
  );
};
