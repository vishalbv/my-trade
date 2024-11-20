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
}

const initialState: TicksState = {
  fyers_web: {},
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
  },
});

// Export actions
export const { updateFyersWebTick, clearFyersWebTicks } = ticksSlice.actions;

// Export reducer
export default ticksSlice.reducer;
