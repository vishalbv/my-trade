"use client";
import React, { useEffect, useState, useRef, useMemo } from "react";
import {
  OptionsAnalyzer,
  OptionsAnalyzerExample,
} from "../../components/Chart/components/OptionsAnalyzer";
import { useSelector } from "react-redux";
import { RootState } from "../../store/store";
import { findNearbyExpiries, PRICECOLOR } from "../../utils/helpers";
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
    id: "relative",
    label: "Relative Movement",
    icon: ArrowUpDownIcon,
  },
  {
    id: "correlation",
    label: "Premium Correlation",
    icon: NetworkIcon,
  },
  // {
  //   id: "percentage",
  //   label: "Percentage Change",
  //   icon: PercentIcon,
  // },
  {
    id: "price",
    label: "Price",
    icon: LineChartIcon,
  },
] as const;

export const OptionsAnalyzerWindow = ({}) => {
  const {
    optionsChartLayouts: {
      [0]: selectedCE,
      [1]: selectedMainSymbol,
      [2]: selectedPE,
    },
    optionChainData,
  } = useSelector((state: RootState) => state.globalChart);

  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const { theme } = useTheme();
  const currentTheme = themes[theme as keyof typeof themes] || themes.light;

  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        const newWidth = containerRef.current.clientWidth;
        setContainerWidth(newWidth);
        // console.log("Container width updated:", newWidth); // Debug log
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
  >("relative");

  const { chartData: chartDataCE } = useRealtimeCandles({
    symbol: selectedCE?.symbol,
    timeframe: "1",
    requestTicksSubscription: true,
  });
  const { chartData: chartDataMain } = useRealtimeCandles({
    symbol: selectedMainSymbol?.symbol,
    timeframe: "1",
    requestTicksSubscription: true,
  });
  const { chartData: chartDataPE } = useRealtimeCandles({
    symbol: selectedPE?.symbol,
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

  console.log(
    correlationData?.[0]?.data?.at(-1),
    chartDataCE.at(-1),
    "correlationData"
  );
  const getTransformedData = () => {
    const getData = () => {
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
    const data = getData();
    if (!data) return [];
    console.log(data, "data");

    const minLength = Math.min(...data.map((i) => i.data.length), 1100);
    return data?.map((i) => ({
      ...i,
      data: i.data.slice(-1 * minLength),
    }));
  };

  const series = getTransformedData() || [];
  //   console.log(series, "series----");

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
      <div style={{ height: "360px" }} ref={containerRef}>
        {series[0] && (
          <LightweightChart
            width={containerWidth}
            height={360}
            series={series}
            legendEnabled={false}
            selectedTransformation={selectedTransformation}
          />
        )}
      </div>

      <div className="flex-1 flex gap-1 mt-4">
        {optionChainData?.data && (
          <div className="w-2/3">
            <OptionChainAnalysis
              data={optionChainData?.data?.slice(
                1,
                optionChainData?.data?.length
              )}
            />
          </div>
        )}
        <div className="flex-1">
          <PCRatio
            data={optionChainData?.data?.slice(
              1,
              optionChainData?.data?.length
            )}
          />
        </div>
      </div>
    </div>
  );
};

const PCRatio = ({ data = [] }) => {
  const putCallRatio = useMemo(() => {
    if (!data || data.length === 0) return 0;

    let totalCallOI = 0;
    let totalPutOI = 0;

    data.forEach((item) => {
      if (item.option_type === "CE") {
        totalCallOI += item.oi;
      } else {
        totalPutOI += item.oi;
      }
    });

    return totalCallOI > 0 ? (totalPutOI / totalCallOI).toFixed(2) : 0;
  }, [data]);

  return (
    <div className="px-4 py-2 text-xs font-medium">
      <div className="text-lg">
        P/C Ratio: <span className={"text-primary"}>{putCallRatio}</span>
      </div>
      <div>
        <div className={cn(PRICECOLOR(-1))}>
          Total Put OI:{" "}
          {formatInLakhs(
            data.reduce(
              (sum, item) => (item.option_type === "PE" ? sum + item.oi : sum),
              0
            )
          )}
        </div>
        <div className={cn(PRICECOLOR(1))}>
          Total Call OI:{" "}
          {formatInLakhs(
            data.reduce(
              (sum, item) => (item.option_type === "CE" ? sum + item.oi : sum),
              0
            )
          )}
        </div>
      </div>
    </div>
  );
};

const formatInLakhs = (value: number): string => {
  return `${(value / 100000).toFixed(2)}L`;
};
