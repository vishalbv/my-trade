import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { DrawingTool, LayoutType, Drawing } from "../../components/Chart/types";
import { DEFAULT_CHART_LAYOUT } from "../../utils/constants";

interface Indicator {
  id: string;
  label: string;
  enabled: boolean;
}

interface ChartState {
  symbol: string;
  timeframe: string;
  drawings: Drawing[];
}

interface GlobalChartState {
  selectedLayout: LayoutType;
  indicators: Indicator[];
  selectedTool: DrawingTool | null;
  showDrawings: boolean;
  selectedChartKey: string;
  layouts: {
    [key: string]: ChartState;
  };
}

const defaultLayout: ChartState = DEFAULT_CHART_LAYOUT;

const initialState: GlobalChartState = {
  selectedLayout: "single" as LayoutType,
  indicators: [{ id: "rsi", label: "RSI", enabled: true }],
  selectedTool: "cursor" as DrawingTool,
  showDrawings: true,
  selectedChartKey: "0",
  layouts: {
    "0": defaultLayout,
  },
};

const globalChartSlice = createSlice({
  name: "globalChart",
  initialState,
  reducers: {
    setSelectedLayout: (state, action: PayloadAction<LayoutType>) => {
      state.selectedLayout = action.payload;
    },
    setIndicators: (state, action: PayloadAction<Indicator[]>) => {
      state.indicators = action.payload;
    },
    setSelectedTool: (state, action: PayloadAction<DrawingTool | null>) => {
      state.selectedTool = action.payload;
    },
    setShowDrawings: (state, action: PayloadAction<boolean>) => {
      state.showDrawings = action.payload;
    },
    addDrawing: (
      state,
      action: PayloadAction<{ chartKey: string; drawing: Drawing }>
    ) => {
      const { chartKey, drawing } = action.payload;
      if (state.layouts[chartKey]) {
        state.layouts[chartKey].drawings.push(drawing);
      }
    },
    updateLayoutSymbol: (
      state,
      action: PayloadAction<{ chartKey: string; symbol: string }>
    ) => {
      const { chartKey, symbol } = action.payload;
      if (state.layouts[chartKey]) {
        state.layouts[chartKey].symbol = symbol;
      }
    },
    updateLayoutTimeframe: (
      state,
      action: PayloadAction<{ chartKey: string; timeframe: string }>
    ) => {
      const { chartKey, timeframe } = action.payload;
      if (state.layouts[chartKey]) {
        state.layouts[chartKey].timeframe = timeframe;
      }
    },
    initializeLayout: (state, action: PayloadAction<{ chartKey: string }>) => {
      const { chartKey } = action.payload;
      if (!state.layouts[chartKey]) {
        state.layouts[chartKey] = state.layouts[0] || defaultLayout;
      }
    },
    setSelectedChartKey: (state, action: PayloadAction<string>) => {
      state.selectedChartKey = action.payload;
    },
    clearDrawings: (state, action: PayloadAction<string>) => {
      const chartKey = action.payload;
      if (state.layouts[chartKey]) {
        state.layouts[chartKey].drawings = [];
      }
    },
  },
});

export const {
  setSelectedLayout,
  setIndicators,
  setSelectedTool,
  setShowDrawings,
  addDrawing,
  updateLayoutSymbol,
  updateLayoutTimeframe,
  initializeLayout,
  setSelectedChartKey,
  clearDrawings,
} = globalChartSlice.actions;

export default globalChartSlice.reducer;
