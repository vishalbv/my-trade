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
  layoutTypeKey: LayoutKeyType;
  [key: string]:
    | {
        symbol: string;
        timeframe: string;
        symbolInfo: any;
      }
    | LayoutKeyType;
}

export type LayoutKeyType = "globalChartLayouts" | "optionsChartLayouts";

interface GlobalChartState {
  selectedLayout: LayoutType;
  indicators: Indicator[];
  selectedTool: DrawingTool | null;
  showDrawings: boolean;
  selectedChartKey: string;
  globalChartLayouts: {
    [key: string]: ChartState;
  };
  optionsChartLayouts: {
    [key: string]: ChartState;
  };
  chartFullScreenId: string | null;
  selectedDrawing: {
    symbol: string;
    drawing: Drawing;
  } | null;
  refreshScalpingMode: number | null;
  optionChainData: OptionChainData | null;
  chartHistoryForOptions: {
    [key: string]: any;
  };
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
  "optionsChartLayouts",
  "globalChartLayouts",
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
  globalChartLayouts: {
    "0": defaultLayout,
  },
  chartFullScreenId: null,
  selectedDrawing: null,
  refreshScalpingMode: null,
  optionChainData: null,
  optionsChartLayouts: {
    "0": defaultLayout,
    "1": defaultLayout,
    "2": defaultLayout,
  },
  chartHistoryForOptions: {},
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
        layoutTypeKey: LayoutKeyType;
      }>
    ) => {
      const {
        chartKey,
        symbol,
        symbolInfo,
        layoutTypeKey = "globalChartLayouts",
      } = action.payload;
      if (state[layoutTypeKey][chartKey]) {
        state[layoutTypeKey][chartKey].symbol = symbol;
        state[layoutTypeKey][chartKey].symbolInfo = symbolInfo;
      }
    },
    updateLayoutTimeframe: (
      state,
      action: PayloadAction<{
        chartKey: string;
        timeframe: string;
        layoutTypeKey: LayoutKeyType;
      }>
    ) => {
      const { chartKey, timeframe, layoutTypeKey } = action.payload;
      if (state[layoutTypeKey][chartKey]) {
        state[layoutTypeKey][chartKey].timeframe = timeframe;
      }
    },
    initializeLayout: (
      state,
      action: PayloadAction<{ chartKey: string; layoutTypeKey: LayoutKeyType }>
    ) => {
      const { chartKey, layoutTypeKey } = action.payload;
      if (!state[layoutTypeKey][chartKey]) {
        state[layoutTypeKey][chartKey] =
          state[layoutTypeKey][0] || defaultLayout;
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
    refreshScalpingMode: (state) => {
      state.refreshScalpingMode = new Date().getTime();

      // If turning off scalping mode, revert to single layout
      // if (!action.payload) {
      //   state.selectedLayout = "single";
      //   // Copy the middle chart (index 1) settings to the main chart (index 0)
      //   if (state.layouts["1"]) {
      //     state.layouts["0"] = { ...state.layouts["1"] };
      //   }
      // }
    },
    updateChartLayout: (state, action: PayloadAction<ChartLayoutUpdate>) => {
      const { layoutTypeKey, ...layouts } = action.payload;
      Object.keys(layouts).forEach((key) => {
        state[layoutTypeKey][key] = layouts[key] as ChartState;
      });
    },
    setOptionChainData: (state, action: PayloadAction<OptionChainData>) => {
      state.optionChainData = action.payload;
    },
    setChartHistoryForOptions: (state, action: any) => {
      state.chartHistoryForOptions[action.payload.chartKey] =
        action.payload.chartData;
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
  updateChartLayout,
  setOptionChainData,
  refreshScalpingMode,
  setChartHistoryForOptions,
} = globalChartSlice.actions;

export default globalChartSlice.reducer;
