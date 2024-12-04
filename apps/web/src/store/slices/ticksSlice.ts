import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";

interface TickData {
  ltp?: number;
  volume?: number;
  high?: number;
  low?: number;
  timestamp?: number;
}

interface TicksState {
  fyers_web: {
    [symbol: string]: TickData;
  };
  shoonya_server: {
    [symbol: string]: number | string;
  };
}

const initialState: TicksState = {
  fyers_web: {},
  shoonya_server: {},
};

export const ticksSlice = createSlice({
  name: "ticks",
  initialState,
  reducers: {
    updateFyersWebTick(
      state,
      action: PayloadAction<{ symbol: string; data: TickData }>
    ) {
      const { symbol, data } = action.payload;
      state.fyers_web[symbol] = {
        ...state.fyers_web[symbol],
        ...data,
      };
    },
    clearFyersWebTicks(state) {
      state.fyers_web = {};
    },
    updateShoonyaServerTick(
      state,
      action: PayloadAction<{ [symbol: string]: number | string }>
    ) {
      console.log("updateShoonyaServerTick", action.payload);
      state.shoonya_server = {
        ...state.shoonya_server,
        ...action.payload,
      };
    },
  },
});

// Export actions
export const {
  updateFyersWebTick,
  clearFyersWebTicks,
  updateShoonyaServerTick,
} = ticksSlice.actions;

// Export reducer
export default ticksSlice.reducer;
