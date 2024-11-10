import { configureStore, ThunkAction, Action, Store } from "@reduxjs/toolkit";
import stateReducer from "./slices/stateSlice";
import drawerReducer from "./slices/drawerSlice";

export const store: Store = configureStore({
  reducer: {
    states: stateReducer,
    drawer: drawerReducer,
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
