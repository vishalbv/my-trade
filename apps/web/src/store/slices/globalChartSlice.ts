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
  symbolDrawings: {
    [symbol: string]: Drawing[];
  };
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
  "symbolDrawings",
];

export const globalChartLocalStorageMiddleware: Middleware =
  (store) => (next) => (action) => {
    const result = next(action);

    // Only save if the action is from globalChart slice
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
  symbolDrawings: {},
  ...getLocalStorageData(),
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
      action: PayloadAction<{ symbol: string; drawing: Drawing }>
    ) => {
      const { symbol, drawing } = action.payload;
      if (!state.symbolDrawings[symbol]) {
        state.symbolDrawings[symbol] = [];
      }
      state.symbolDrawings[symbol].push(drawing);
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
      const symbol = action.payload;
      state.symbolDrawings[symbol] = [];
    },
    updateDrawing: (
      state,
      action: PayloadAction<{ symbol: string; drawing: Drawing }>
    ) => {
      const { symbol, drawing } = action.payload;
      if (state.symbolDrawings[symbol]) {
        const index = state.symbolDrawings[symbol].findIndex(
          (d) => d.id === drawing.id
        );
        if (index !== -1) {
          state.symbolDrawings[symbol][index] = drawing;
        }
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
  updateDrawing,
} = globalChartSlice.actions;

export default globalChartSlice.reducer;
