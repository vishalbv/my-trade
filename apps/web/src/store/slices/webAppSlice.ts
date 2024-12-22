import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface WebAppState {
  isLeftNavCollapsed: boolean;
  showPositionsOrders: boolean;
  showOptionsAnalyzer: boolean;
  topWindowSize: number;
  rightWindowSize: number;
}

const initialState: WebAppState = {
  isLeftNavCollapsed: false,
  showPositionsOrders: true,
  showOptionsAnalyzer: true,
  topWindowSize: 0,
  rightWindowSize: 0,
};

export const webAppSlice = createSlice({
  name: "webApp",
  initialState,
  reducers: {
    toggleLeftNav: (state, action: PayloadAction<boolean>) => {
      state.isLeftNavCollapsed = action.payload;
    },
    togglePositionsOrders: (state) => {
      state.showPositionsOrders = !state.showPositionsOrders;
    },
    toggleOptionsAnalyzer: (state) => {
      state.showOptionsAnalyzer = !state.showOptionsAnalyzer;
    },
    setTopWindowSize: (state, action: PayloadAction<number>) => {
      state.topWindowSize = action.payload;
    },
    setRightWindowSize: (state, action: PayloadAction<number>) => {
      state.rightWindowSize = action.payload;
    },
  },
});

export const {
  toggleLeftNav,
  togglePositionsOrders,
  toggleOptionsAnalyzer,
  setTopWindowSize,
  setRightWindowSize,
} = webAppSlice.actions;
export default webAppSlice.reducer;
