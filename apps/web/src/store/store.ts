import { configureStore, ThunkAction, Action, Store } from "@reduxjs/toolkit";
import stateReducer from "./slices/stateSlice";
import drawerReducer from "./slices/drawerSlice";
import ticksReducer from "./slices/ticksSlice";

export const store: Store = configureStore({
  reducer: {
    states: stateReducer,
    drawer: drawerReducer,
    ticks: ticksReducer,
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
