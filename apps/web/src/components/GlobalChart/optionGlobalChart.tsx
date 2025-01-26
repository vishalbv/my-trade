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
import { useScalpingMode } from "../../hooks/useScalpingMode";

export default function OptionGlobalChart() {
  const dispatch = useDispatch();

  const { optionsChartLayouts, indicators, selectedTool, showDrawings } =
    useSelector((state: RootState) => state.globalChart);

  const { isInitializing } = useScalpingMode();

  if (isInitializing) return null;

  return (
    <div className="flex flex-col h-full relative">
      <div className="flex h-full">
        <div className="flex flex-col items-center py-2 border-r border-border">
          <ChartTools
            layoutTypeKey="optionsChartLayouts"
            indicators={indicators}
            setIndicators={(newIndicators) =>
              dispatch(setIndicators(newIndicators))
            }
            selectedLayout={"horizontalThree"}
            setSelectedLayout={(layout) => dispatch(setSelectedLayout(layout))}
            layoutOptions={layoutOptions}
            currentLayout={layoutOptions.find(
              (l) => l.id === "horizontalThree"
            )}
            isLayoutSelectionDisabled={true}
            selectedTool={selectedTool}
            setSelectedTool={(tool) => dispatch(setSelectedTool(tool))}
            showDrawings={showDrawings}
            setShowDrawings={(show) => dispatch(setShowDrawings(show))}
          />
        </div>

        <div className="flex-1 min-h-0 relative">
          <ChartLayout
            layoutTypeKey="optionsChartLayouts"
            layout={"horizontalThree"}
            timeframeConfigs={timeframeConfigs}
            indicators={indicators}
          />
        </div>
      </div>
    </div>
  );
}
