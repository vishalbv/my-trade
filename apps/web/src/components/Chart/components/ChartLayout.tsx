import { TimeframeConfig } from "../types";
import { ChartContainer } from "./ChartContainer";

interface ChartLayoutProps {
  layout: string;
  timeframeConfigs: { [key: string]: TimeframeConfig };
}

export const ChartLayout = ({ layout, timeframeConfigs }: ChartLayoutProps) => {
  const renderLayout = () => {
    switch (layout) {
      case "single":
        return (
          <div className="h-full w-full">
            <ChartContainer
              timeframeConfigs={timeframeConfigs}
              layoutKey={`${layout}-0`}
            />
          </div>
        );

      case "horizontal":
        return (
          <div className="grid grid-cols-2 gap-[1px] h-full w-full bg-border">
            <div className="bg-background h-full">
              <ChartContainer
                timeframeConfigs={timeframeConfigs}
                layoutKey={`${layout}-0`}
              />
            </div>
            <div className="bg-background h-full">
              <ChartContainer
                timeframeConfigs={timeframeConfigs}
                layoutKey={`${layout}-1`}
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
                layoutKey={`${layout}-0`}
              />
            </div>
            <div className="bg-background h-full">
              <ChartContainer
                timeframeConfigs={timeframeConfigs}
                layoutKey={`${layout}-1`}
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
                  layoutKey={`${layout}-0`}
                />
              </div>
              <div className="bg-background h-full">
                <ChartContainer
                  timeframeConfigs={timeframeConfigs}
                  layoutKey={`${layout}-1`}
                />
              </div>
            </div>
            <div className="bg-background h-full">
              <ChartContainer
                timeframeConfigs={timeframeConfigs}
                layoutKey={`${layout}-2`}
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
                layoutKey={`${layout}-0`}
              />
            </div>
            <div className="grid grid-rows-2 gap-[1px] h-full">
              <div className="bg-background h-full">
                <ChartContainer
                  timeframeConfigs={timeframeConfigs}
                  layoutKey={`${layout}-1`}
                />
              </div>
              <div className="bg-background h-full">
                <ChartContainer
                  timeframeConfigs={timeframeConfigs}
                  layoutKey={`${layout}-2`}
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
                  layoutKey={`${layout}-0`}
                />
              </div>
              <div className="bg-background h-full">
                <ChartContainer
                  timeframeConfigs={timeframeConfigs}
                  layoutKey={`${layout}-1`}
                />
              </div>
            </div>
            <div className="bg-background h-full">
              <ChartContainer
                timeframeConfigs={timeframeConfigs}
                layoutKey={`${layout}-2`}
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
                layoutKey={`${layout}-0`}
              />
            </div>
            <div className="bg-background h-full">
              <ChartContainer
                timeframeConfigs={timeframeConfigs}
                layoutKey={`${layout}-1`}
              />
            </div>
            <div className="bg-background h-full">
              <ChartContainer
                timeframeConfigs={timeframeConfigs}
                layoutKey={`${layout}-2`}
              />
            </div>
            <div className="bg-background h-full">
              <ChartContainer
                timeframeConfigs={timeframeConfigs}
                layoutKey={`${layout}-3`}
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
