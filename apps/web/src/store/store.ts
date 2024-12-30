import { configureStore, ThunkAction, Action, Store } from "@reduxjs/toolkit";
import stateReducer from "./slices/stateSlice";
import drawerReducer from "./slices/drawerSlice";
import ticksReducer from "./slices/ticksSlice";
import globalChartReducer, {
  globalChartLocalStorageMiddleware,
} from "./slices/globalChartSlice";
import { serverStateUpdateMiddleware } from "./middlewares/serverStateUpdateMiddleware";
import { updateDispatch } from "../services/webSocket";
import webAppReducer from "./slices/webAppSlice";
import drawingHistoryReducer from "./slices/drawingHistorySlice";

export const store: Store = configureStore({
  reducer: {
    states: stateReducer,
    drawer: drawerReducer,
    ticks: ticksReducer,
    globalChart: globalChartReducer,
    webApp: webAppReducer,
    drawingHistory: drawingHistoryReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }).concat([globalChartLocalStorageMiddleware, serverStateUpdateMiddleware]),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
export type AppThunk<ReturnType = void> = ThunkAction<
  ReturnType,
  RootState,
  unknown,
  Action<string>
>;
updateDispatch(store.dispatch);

export default store;
