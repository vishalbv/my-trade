import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface WebAppState {
  isLeftNavCollapsed: boolean;
}

const initialState: WebAppState = {
  isLeftNavCollapsed: false,
};

export const webAppSlice = createSlice({
  name: "webApp",
  initialState,
  reducers: {
    toggleLeftNav: (state, action: PayloadAction<boolean>) => {
      state.isLeftNavCollapsed = action.payload;
    },
  },
});

export const { toggleLeftNav } = webAppSlice.actions;
export default webAppSlice.reducer;
