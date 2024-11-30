import { configureStore, ThunkAction, Action, Store } from "@reduxjs/toolkit";
import stateReducer from "./slices/stateSlice";
import drawerReducer from "./slices/drawerSlice";
import ticksReducer from "./slices/ticksSlice";
import globalChartReducer from "./slices/globalChartSlice";

export const store: Store = configureStore({
  reducer: {
    states: stateReducer,
    drawer: drawerReducer,
    ticks: ticksReducer,
    globalChart: globalChartReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
export type AppThunk<ReturnType = void> = ThunkAction<
  ReturnType,
  RootState,
  unknown,
  Action<string>
>;

export default store;
