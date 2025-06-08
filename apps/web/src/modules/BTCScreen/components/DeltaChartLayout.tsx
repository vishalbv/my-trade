import { memo, useEffect, useRef, useState } from "react";
import { deltaWebSocket } from "../../../services/deltaWebSocket";
import { BTCChartContainer } from "./BTCChartContainer";
import { useDeltaRealtimeCandles } from "../hooks/useDeltaRealtimeCandles";

interface Indicator {
  id: string;
  label: string;
  enabled: boolean;
}

interface DeltaChartLayoutProps {
  layout: string;
  timeframeConfigs: any;
  indicators: Indicator[];
}

interface ChartData {
  [key: string]: {
    data: any[];
    isLoading: boolean;
    error: string | null;
  };
}

const SYMBOLS = {
  "0": "BTCUSD",
  "1": "ETHUSD",
  "2": "BTCUSD",
  "3": "ETHUSD",
};

const MemoizedBTCChartContainer = memo(BTCChartContainer);

export const DeltaChartLayout = memo(
  ({ layout, timeframeConfigs, indicators }: DeltaChartLayoutProps) => {
    const [chartData, setChartData] = useState<ChartData>({});

    // Initialize chart data for each chart key
    useEffect(() => {
      const initialChartData: ChartData = {};
      Object.entries(SYMBOLS).forEach(([key, symbol]) => {
        initialChartData[key] = {
          data: [],
          isLoading: true,
          error: null,
        };
      });
      setChartData(initialChartData);
    }, []);

    // Set up real-time data for each chart
    Object.entries(SYMBOLS).forEach(([key, symbol]) => {
      const { chartData: data, error } = useDeltaRealtimeCandles({
        symbol,
        resolution: timeframeConfigs.interval,
      });

      useEffect(() => {
        setChartData((prev) => ({
          ...prev,
          [key]: {
            data,
            isLoading: data.length === 0,
            error,
          },
        }));
      }, [data, error]);
    });

    const renderChart = (chartKey: string) => (
      <MemoizedBTCChartContainer
        timeframeConfig={timeframeConfigs}
        chartKey={chartKey}
        indicators={indicators}
        data={chartData[chartKey]?.data || []}
        isLoading={chartData[chartKey]?.isLoading || false}
        error={chartData[chartKey]?.error || null}
      />
    );

    const renderLayout = () => {
      switch (layout) {
        case "single":
          return renderChart("0");

        case "horizontal":
          return (
            <div className="grid grid-cols-2 gap-[1px] h-full w-full bg-border">
              {renderChart("0")}
              {renderChart("1")}
            </div>
          );

        case "vertical":
          return (
            <div className="grid grid-rows-2 gap-[1px] h-full w-full bg-border">
              {renderChart("0")}
              {renderChart("1")}
            </div>
          );

        case "grid":
          return (
            <div className="grid grid-cols-2 grid-rows-2 gap-[1px] h-full w-full bg-border">
              {renderChart("0")}
              {renderChart("1")}
              {renderChart("2")}
              {renderChart("3")}
            </div>
          );

        case "horizontalThree":
          return (
            <div className="grid grid-cols-3 gap-[1px] h-full w-full bg-border">
              {renderChart("0")}
              {renderChart("1")}
              {renderChart("2")}
            </div>
          );

        default:
          return null;
      }
    };

    return (
      <div className="w-full h-full bg-background overflow-hidden">
        {renderLayout()}
      </div>
    );
  }
);
