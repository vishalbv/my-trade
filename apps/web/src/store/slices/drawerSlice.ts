import { createSlice, PayloadAction } from "@reduxjs/toolkit";

type DrawerType = "right" | "task" | "notes" | "timers" | null;

interface DrawerState {
  activeDrawer: DrawerType;
}

const initialState: DrawerState = {
  activeDrawer: null,
};

export const drawerSlice = createSlice({
  name: "drawer",
  initialState,
  reducers: {
    toggleDrawer: (state, action: PayloadAction<DrawerType>) => {
      state.activeDrawer =
        state.activeDrawer === action.payload ? null : action.payload;
    },
    closeAllDrawers: (state) => {
      state.activeDrawer = null;
    },
  },
});

export const { toggleDrawer, closeAllDrawers } = drawerSlice.actions;
export default drawerSlice.reducer;
