import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { DrawingTool, LayoutType, Drawing } from "../../components/Chart/types";
import { DEFAULT_CHART_LAYOUT } from "../../utils/constants";
import { Middleware } from "@reduxjs/toolkit";
import { RootState } from "../store";

interface Indicator {
  id: string;
  label: string;
  enabled: boolean;
}

interface ChartState {
  symbol: string;
  timeframe: string;
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
  chartFullScreenId: string | null;
  selectedDrawing: {
    symbol: string;
    drawing: Drawing;
  } | null;
}

const defaultLayout: ChartState = {
  ...DEFAULT_CHART_LAYOUT,
};

const getLocalStorageData = () => {
  const stored = localStorage.getItem("globalChartState");
  return stored ? JSON.parse(stored) : {};
};

const keysToSaveInLocalStorage = [
  "selectedLayout",
  "indicators",
  "showDrawings",
  "layouts",
];

export const globalChartLocalStorageMiddleware: Middleware =
  (store) => (next) => (action) => {
    const result = next(action);

    // Only save if the action is from globalChart slice...
    if (action.type.startsWith("globalChart/")) {
      const state = store.getState() as RootState;
      const dataToSave = keysToSaveInLocalStorage.reduce((acc, key) => {
        acc[key] = state.globalChart[key];
        return acc;
      }, {});
      localStorage.setItem("globalChartState", JSON.stringify(dataToSave));
    }

    return result;
  };

const initialState: GlobalChartState = {
  selectedLayout: "single" as LayoutType,
  indicators: [{ id: "rsi", label: "RSI", enabled: true }],
  selectedTool: "cursor" as DrawingTool,
  showDrawings: true,
  selectedChartKey: "0",
  layouts: {
    "0": defaultLayout,
  },
  chartFullScreenId: null,
  selectedDrawing: null,
  ...getLocalStorageData(),
};

const globalChartSlice = createSlice({
  name: "globalChart",
  initialState,
  reducers: {
    setSelectedLayout: (state, action: PayloadAction<LayoutType>) => {
      state.selectedLayout = action.payload;
      state.chartFullScreenId = null;
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
    setChartFullScreenId: (state, action: PayloadAction<string>) => {
      state.chartFullScreenId =
        state.chartFullScreenId === action.payload ? null : action.payload;
    },
    setSelectedDrawing: (
      state,
      action: PayloadAction<{ symbol: string; drawing: Drawing } | null>
    ) => {
      state.selectedDrawing = action.payload;
    },
    deleteSelectedDrawing: (state) => {
      state.selectedDrawing = null;
    },
  },
});

export const {
  setSelectedLayout,
  setIndicators,
  setSelectedTool,
  setShowDrawings,
  updateLayoutSymbol,
  updateLayoutTimeframe,
  initializeLayout,
  setSelectedChartKey,
  setChartFullScreenId,
  setSelectedDrawing,
  deleteSelectedDrawing,
} = globalChartSlice.actions;

export default globalChartSlice.reducer;
