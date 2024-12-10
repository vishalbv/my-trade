import { fyersDataSocketService } from "../../../services/fyersDataSocket";
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
  layout: string;
  timeframeConfigs: { [key: string]: TimeframeConfig };
  indicators: Indicator[];
}

export const ChartLayout = memo(
  ({ layout, timeframeConfigs, indicators }: ChartLayoutProps) => {
    const isMarketActive = useSelector(
      (state: any) => state.states?.app?.marketStatus?.activeStatus
    );

    const symbols = useSelector((state: any) =>
      Object.values(state.globalChart.layouts).map((l: any) => l.symbol)
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
          console.log("Unsubscribing from:", symbolsToUnsubscribe);
          fyersDataSocketService.unsubscribe(symbolsToUnsubscribe);
        }

        if (symbolsToSubscribe.length > 0) {
          console.log("Subscribing to:", symbolsToSubscribe);
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
          console.log("Component unmounting - cleanup:", uniqueSymbols);
          fyersDataSocketService.unsubscribe(uniqueSymbols);
        }
      };
    }, []); // Empty dependency array means this runs only on mount/unmount

    const renderLayout = () => {
      switch (layout) {
        case "single":
          return (
            <div className="h-full w-full">
              <ChartContainer
                timeframeConfigs={timeframeConfigs}
                chartKey="0"
                indicators={indicators}
              />
            </div>
          );

        case "horizontal":
          return (
            <div className="grid grid-cols-2 gap-[1px] h-full w-full bg-border">
              <div className="bg-background h-full">
                <ChartContainer
                  timeframeConfigs={timeframeConfigs}
                  chartKey="0"
                  indicators={indicators}
                />
              </div>
              <div className="bg-background h-full">
                <ChartContainer
                  timeframeConfigs={timeframeConfigs}
                  chartKey="1"
                  indicators={indicators}
                />
              </div>
            </div>
          );

        case "vertical":
          return (
            <div className="grid grid-rows-2 gap-[1px] h-full w-full bg-border">
              <div className="bg-background h-full">
                <ChartContainer
                  timeframeConfigs={timeframeConfigs}
                  chartKey="0"
                  indicators={indicators}
                />
              </div>
              <div className="bg-background h-full">
                <ChartContainer
                  timeframeConfigs={timeframeConfigs}
                  chartKey="1"
                  indicators={indicators}
                />
              </div>
            </div>
          );

        case "verticalLeft":
          return (
            <div className="grid grid-cols-2 gap-[1px] h-full w-full bg-border">
              <div className="grid grid-rows-2 gap-[1px] h-full">
                <div className="bg-background h-full">
                  <ChartContainer
                    timeframeConfigs={timeframeConfigs}
                    chartKey="0"
                    indicators={indicators}
                  />
                </div>
                <div className="bg-background h-full">
                  <ChartContainer
                    timeframeConfigs={timeframeConfigs}
                    chartKey="1"
                    indicators={indicators}
                  />
                </div>
              </div>
              <div className="bg-background h-full">
                <ChartContainer
                  timeframeConfigs={timeframeConfigs}
                  chartKey="2"
                  indicators={indicators}
                />
              </div>
            </div>
          );

        case "verticalRight":
          return (
            <div className="grid grid-cols-2 gap-[1px] h-full w-full bg-border">
              <div className="bg-background h-full">
                <ChartContainer
                  timeframeConfigs={timeframeConfigs}
                  chartKey="0"
                  indicators={indicators}
                />
              </div>
              <div className="grid grid-rows-2 gap-[1px] h-full">
                <div className="bg-background h-full">
                  <ChartContainer
                    timeframeConfigs={timeframeConfigs}
                    chartKey="1"
                    indicators={indicators}
                  />
                </div>
                <div className="bg-background h-full">
                  <ChartContainer
                    timeframeConfigs={timeframeConfigs}
                    chartKey="2"
                    indicators={indicators}
                  />
                </div>
              </div>
            </div>
          );

        case "topTwo":
          return (
            <div className="grid grid-rows-2 gap-[1px] h-full w-full bg-border">
              <div className="grid grid-cols-2 gap-[1px] h-full">
                <div className="bg-background h-full">
                  <ChartContainer
                    timeframeConfigs={timeframeConfigs}
                    chartKey="0"
                    indicators={indicators}
                  />
                </div>
                <div className="bg-background h-full">
                  <ChartContainer
                    timeframeConfigs={timeframeConfigs}
                    chartKey="1"
                    indicators={indicators}
                  />
                </div>
              </div>
              <div className="bg-background h-full">
                <ChartContainer
                  timeframeConfigs={timeframeConfigs}
                  chartKey="2"
                  indicators={indicators}
                />
              </div>
            </div>
          );

        case "grid":
          return (
            <div className="grid grid-cols-2 grid-rows-2 gap-[1px] h-full w-full bg-border">
              <div className="bg-background h-full">
                <ChartContainer
                  timeframeConfigs={timeframeConfigs}
                  chartKey="0"
                  indicators={indicators}
                />
              </div>
              <div className="bg-background h-full">
                <ChartContainer
                  timeframeConfigs={timeframeConfigs}
                  chartKey="1"
                  indicators={indicators}
                />
              </div>
              <div className="bg-background h-full">
                <ChartContainer
                  timeframeConfigs={timeframeConfigs}
                  chartKey="2"
                  indicators={indicators}
                />
              </div>
              <div className="bg-background h-full">
                <ChartContainer
                  timeframeConfigs={timeframeConfigs}
                  chartKey="3"
                  indicators={indicators}
                />
              </div>
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
