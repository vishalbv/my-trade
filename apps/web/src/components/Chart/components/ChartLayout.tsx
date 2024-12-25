import { fyersDataSocketService } from "../../../services/fyersDataSocket";
import { LayoutKeyType } from "../../../store/slices/globalChartSlice";
import { TimeframeConfig } from "../types";
import { ChartContainer } from "./ChartContainer";
import { memo, useEffect, useRef } from "react";
import { useSelector } from "react-redux";

interface Indicator {
  id: string;
  label: string;
  enabled: boolean;
}

interface ChartLayoutProps {
  layoutTypeKey: LayoutKeyType;
  layout: string;
  timeframeConfigs: { [key: string]: TimeframeConfig };
  indicators: Indicator[];
}

const MemoizedChartContainer = memo(ChartContainer);

export const ChartLayout = memo(
  ({
    layoutTypeKey,
    layout,
    timeframeConfigs,
    indicators,
  }: ChartLayoutProps) => {
    const isMarketActive = useSelector(
      (state: any) => state.states?.app?.marketStatus?.activeStatus
    );

    const symbols = useSelector((state: any) =>
      Object.values(state.globalChart[layoutTypeKey]).map((l: any) => l.symbol)
    );
    const previousSymbols = useRef<string[]>([]);

    // Effect for handling symbol changes
    useEffect(() => {
      if (isMarketActive) {
        const uniqueCurrentSymbols = [...new Set(symbols)];
        const uniquePreviousSymbols = [...new Set(previousSymbols.current)];

        const symbolsToSubscribe = uniqueCurrentSymbols.filter(
          (symbol) => !uniquePreviousSymbols.includes(symbol)
        );
        const symbolsToUnsubscribe = uniquePreviousSymbols.filter(
          (symbol) => !uniqueCurrentSymbols.includes(symbol)
        );

        if (symbolsToUnsubscribe.length > 0) {
          fyersDataSocketService.unsubscribe(symbolsToUnsubscribe);
        }

        if (symbolsToSubscribe.length > 0) {
          fyersDataSocketService.subscribe(symbolsToSubscribe);
        }

        previousSymbols.current = uniqueCurrentSymbols;
      }
    }, [symbols, isMarketActive]);

    // Separate effect for cleanup only
    useEffect(() => {
      return () => {
        const uniqueSymbols = [...new Set(symbols)];
        if (uniqueSymbols.length > 0) {
          fyersDataSocketService.unsubscribe(uniqueSymbols);
        }
      };
    }, []); // Empty dependency array means this runs only on mount/unmount

    const renderLayout = () => {
      switch (layout) {
        case "single":
          return (
            <MemoizedChartContainer
              timeframeConfigs={timeframeConfigs}
              chartKey="0"
              indicators={indicators}
              layoutTypeKey={layoutTypeKey}
            />
          );

        case "horizontal":
          return (
            <div className="grid grid-cols-2 gap-[1px] h-full w-full bg-border">
              <MemoizedChartContainer
                timeframeConfigs={timeframeConfigs}
                chartKey="0"
                indicators={indicators}
                layoutTypeKey={layoutTypeKey}
              />

              <MemoizedChartContainer
                timeframeConfigs={timeframeConfigs}
                chartKey="1"
                indicators={indicators}
                layoutTypeKey={layoutTypeKey}
              />
            </div>
          );

        case "vertical":
          return (
            <div className="grid grid-rows-2 gap-[1px] h-full w-full bg-border">
              <MemoizedChartContainer
                timeframeConfigs={timeframeConfigs}
                chartKey="0"
                indicators={indicators}
                layoutTypeKey={layoutTypeKey}
              />

              <MemoizedChartContainer
                timeframeConfigs={timeframeConfigs}
                chartKey="1"
                indicators={indicators}
                layoutTypeKey={layoutTypeKey}
              />
            </div>
          );

        case "verticalLeft":
          return (
            <div className="grid grid-cols-2 gap-[1px] h-full w-full bg-border">
              <div className="grid grid-rows-2 gap-[1px] h-full">
                <MemoizedChartContainer
                  timeframeConfigs={timeframeConfigs}
                  chartKey="0"
                  indicators={indicators}
                  layoutTypeKey={layoutTypeKey}
                />

                <MemoizedChartContainer
                  timeframeConfigs={timeframeConfigs}
                  chartKey="1"
                  indicators={indicators}
                  layoutTypeKey={layoutTypeKey}
                />
              </div>

              <MemoizedChartContainer
                timeframeConfigs={timeframeConfigs}
                chartKey="2"
                indicators={indicators}
                layoutTypeKey={layoutTypeKey}
              />
            </div>
          );

        case "verticalRight":
          return (
            <div className="grid grid-cols-2 gap-[1px] h-full w-full bg-border">
              <MemoizedChartContainer
                timeframeConfigs={timeframeConfigs}
                chartKey="0"
                indicators={indicators}
                layoutTypeKey={layoutTypeKey}
              />

              <div className="grid grid-rows-2 gap-[1px] h-full">
                <MemoizedChartContainer
                  timeframeConfigs={timeframeConfigs}
                  chartKey="1"
                  indicators={indicators}
                  layoutTypeKey={layoutTypeKey}
                />

                <MemoizedChartContainer
                  timeframeConfigs={timeframeConfigs}
                  chartKey="2"
                  indicators={indicators}
                  layoutTypeKey={layoutTypeKey}
                />
              </div>
            </div>
          );

        case "topTwo":
          return (
            <div className="grid grid-rows-2 gap-[1px] h-full w-full bg-border">
              <div className="grid grid-cols-2 gap-[1px] h-full">
                <MemoizedChartContainer
                  timeframeConfigs={timeframeConfigs}
                  chartKey="0"
                  indicators={indicators}
                  layoutTypeKey={layoutTypeKey}
                />

                <MemoizedChartContainer
                  timeframeConfigs={timeframeConfigs}
                  chartKey="1"
                  indicators={indicators}
                  layoutTypeKey={layoutTypeKey}
                />
              </div>

              <MemoizedChartContainer
                timeframeConfigs={timeframeConfigs}
                chartKey="2"
                indicators={indicators}
                layoutTypeKey={layoutTypeKey}
              />
            </div>
          );

        case "grid":
          return (
            <div className="grid grid-cols-2 grid-rows-2 gap-[1px] h-full w-full bg-border">
              <MemoizedChartContainer
                timeframeConfigs={timeframeConfigs}
                chartKey="0"
                indicators={indicators}
                layoutTypeKey={layoutTypeKey}
              />

              <MemoizedChartContainer
                timeframeConfigs={timeframeConfigs}
                chartKey="1"
                indicators={indicators}
                layoutTypeKey={layoutTypeKey}
              />

              <MemoizedChartContainer
                timeframeConfigs={timeframeConfigs}
                chartKey="2"
                indicators={indicators}
                layoutTypeKey={layoutTypeKey}
              />

              <MemoizedChartContainer
                timeframeConfigs={timeframeConfigs}
                chartKey="3"
                indicators={indicators}
                layoutTypeKey={layoutTypeKey}
              />
            </div>
          );

        case "horizontalThree":
          return (
            <div className="grid grid-cols-3 gap-[1px] h-full w-full bg-border">
              <MemoizedChartContainer
                timeframeConfigs={timeframeConfigs}
                chartKey="0"
                indicators={indicators}
                layoutTypeKey={layoutTypeKey}
              />

              <MemoizedChartContainer
                timeframeConfigs={timeframeConfigs}
                chartKey="1"
                indicators={indicators}
                layoutTypeKey={layoutTypeKey}
              />

              <MemoizedChartContainer
                timeframeConfigs={timeframeConfigs}
                chartKey="2"
                indicators={indicators}
                layoutTypeKey={layoutTypeKey}
              />
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
