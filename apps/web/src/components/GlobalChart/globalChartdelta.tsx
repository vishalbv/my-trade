"use client";

import { useDispatch, useSelector } from "react-redux";
import {
  setSelectedLayout,
  setIndicators,
  setSelectedTool,
  setShowDrawings,
} from "../../store/slices/globalChartSlice";
import { RootState } from "../../store/store";
import { ChartLayout } from "../Chart/components/ChartLayout";
import { ChartTools } from "../Chart/components/ChartTools";
import { layoutOptions, timeframeConfigs } from "./globalChartUtils";
import { BTCChartContainer } from "../../modules/BTCScreen/components/BTCChartContainer";
import { DeltaChartLayout } from "../../modules/BTCScreen/components/DeltaChartLayout";

const DEFAULT_TIMEFRAME_CONFIG = {
  interval: "15m",
  candleWidth: 5,
  gridLines: true,
  minScaleDays: 0.1, // ~2.4 hours minimum
  maxScaleDays: 5,
  tickFormat: (timestamp: number) => {
    const date = new Date(timestamp);
    return `${date.getDate().toString().padStart(2, "0")}-${date.toLocaleString(
      "default",
      {
        month: "short",
      }
    )}-${date.getFullYear()}  ${date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    })}`;
  },
};

export default function GlobalChartDelta() {
  const dispatch = useDispatch();

  const { selectedLayout, indicators, selectedTool, showDrawings } =
    useSelector((state: RootState) => state.globalChart);

  return (
    <div className="flex flex-col h-full relative">
      <div className="flex h-full">
        <div className="flex flex-col items-center py-2 border-r border-border">
          <ChartTools
            indicators={indicators}
            layoutTypeKey="globalChartLayouts"
            setIndicators={(newIndicators) =>
              dispatch(setIndicators(newIndicators))
            }
            selectedLayout={selectedLayout}
            setSelectedLayout={(layout) => dispatch(setSelectedLayout(layout))}
            layoutOptions={layoutOptions}
            currentLayout={layoutOptions.find((l) => l.id === selectedLayout)}
            selectedTool={selectedTool}
            setSelectedTool={(tool) => dispatch(setSelectedTool(tool))}
            showDrawings={showDrawings}
            setShowDrawings={(show) => dispatch(setShowDrawings(show))}
          />
        </div>

        <div className="flex-1 min-h-0 relative">
          <DeltaChartLayout
            layout={selectedLayout}
            timeframeConfigs={DEFAULT_TIMEFRAME_CONFIG}
            indicators={indicators}
          />
        </div>
      </div>
    </div>
  );
}
