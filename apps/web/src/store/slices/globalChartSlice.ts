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
  symbolInfo?: any;
}

interface OptionChainData {
  symbol: string;
  expiry: string;
  data: any; // Replace 'any' with your option chain type
  atmStrike: number;
}

interface ChartLayoutUpdate {
  [key: string]: {
    symbol?: string;
    timeframe?: string;
  };
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
  scalpingMode: boolean;
  optionChainData: OptionChainData | null;
}

const defaultLayout: ChartState = {
  ...DEFAULT_CHART_LAYOUT,
};
const isClient = typeof window !== "undefined";

const getLocalStorageData = () => {
  if (isClient) {
    const stored = localStorage.getItem("globalChartState");
    return stored ? JSON.parse(stored) : {};
  } else return {};
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
    if ((action as { type: string }).type.startsWith("globalChart/")) {
      const state = store.getState() as RootState;
      const dataToSave = keysToSaveInLocalStorage.reduce(
        (acc: Record<string, any>, key) => {
          acc[key] = state.globalChart[key];
          return acc;
        },
        {}
      );
      isClient &&
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
  scalpingMode: false,
  optionChainData: null,
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
      action: PayloadAction<{
        chartKey: string;
        symbol: string;
        symbolInfo?: any;
      }>
    ) => {
      const { chartKey, symbol, symbolInfo } = action.payload;
      if (state.layouts[chartKey]) {
        state.layouts[chartKey].symbol = symbol;
        state.layouts[chartKey].symbolInfo = symbolInfo;
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
    setScalpingMode: (state, action: PayloadAction<boolean>) => {
      state.scalpingMode = action.payload;

      // If turning off scalping mode, revert to single layout
      if (!action.payload) {
        state.selectedLayout = "single";
        // Copy the middle chart (index 1) settings to the main chart (index 0)
        if (state.layouts["1"]) {
          state.layouts["0"] = { ...state.layouts["1"] };
        }
      }
    },
    updateChartLayout: (state, action: PayloadAction<ChartLayoutUpdate>) => {
      Object.entries(action.payload).forEach(([key, value]) => {
        if (!state.layouts[key]) {
          state.layouts[key] = { ...defaultLayout };
        }
        if (value.symbol) {
          state.layouts[key].symbol = value.symbol;
        }
        if (value.timeframe) {
          state.layouts[key].timeframe = value.timeframe;
        }
      });
    },
    setOptionChainData: (state, action: PayloadAction<OptionChainData>) => {
      state.optionChainData = action.payload;
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
  setScalpingMode,
  updateChartLayout,
  setOptionChainData,
} = globalChartSlice.actions;

export default globalChartSlice.reducer;
