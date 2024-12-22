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

export default function GlobalChart() {
  const dispatch = useDispatch();

  const { selectedLayout, indicators, selectedTool, showDrawings } =
    useSelector((state: RootState) => state.globalChart);

  return (
    <div className="flex flex-col h-full relative">
      <div className="flex h-full">
        <div className="flex flex-col items-center py-2 border-r border-border">
          <ChartTools
            indicators={indicators}
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
          <ChartLayout
            layoutTypeKey="globalChartLayouts"
            layout={selectedLayout}
            timeframeConfigs={timeframeConfigs}
            indicators={indicators}
          />
        </div>
      </div>
    </div>
  );
}
