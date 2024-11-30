import { TimeframeConfig } from "../types";
import { ChartContainer } from "./ChartContainer";

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

export const ChartLayout = ({
  layout,
  timeframeConfigs,
  indicators,
}: ChartLayoutProps) => {
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
};
