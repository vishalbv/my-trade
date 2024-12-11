import { Middleware } from "@reduxjs/toolkit";
import { RootState } from "../store";

import { sendMessage } from "../../services/webSocket";

export const serverStateUpdateMiddleware: Middleware =
  (store) => (next) => async (action: any) => {
    const prevState = store.getState() as RootState;
    const result = next(action);
    const currentState = store.getState() as RootState;

    if (action.payload?.data?.fromServerState) {
      return result;
    }
    // Check if the action is from drawings slice
    if (action.type.startsWith("states/") && action.payload.id === "drawings") {
      const prevDrawings = prevState.states.drawings;
      const currentDrawings = currentState.states.drawings;

      // Check if any symbol's drawings have change...sdsnwewsdsqwqwwew
      const hasDrawingsChangedSymbol = Object.keys(currentDrawings).find(
        (symbol) => prevDrawings[symbol] !== currentDrawings[symbol]
      );

      if (hasDrawingsChangedSymbol && hasDrawingsChangedSymbol !== "id") {
        sendMessage("drawings", {
          fromUiState: true,
          _db: true,
          [hasDrawingsChangedSymbol]: currentDrawings[hasDrawingsChangedSymbol],
        });
      }
    }
    if (action.type.startsWith("states/") && action.payload.id === "alerts") {
      const prevAlerts = prevState.states.alerts;
      const currentAlerts = currentState.states.alerts;

      const hasAlertsChangedId = Object.keys(currentAlerts).find(
        (id) => prevAlerts[id] !== currentAlerts[id]
      );

      if (hasAlertsChangedId && hasAlertsChangedId !== "id") {
        sendMessage("alerts", {
          fromUiState: true,
          _db: true,
          [hasAlertsChangedId]: currentAlerts[hasAlertsChangedId],
        });
      }
    }

    return result;
  };
