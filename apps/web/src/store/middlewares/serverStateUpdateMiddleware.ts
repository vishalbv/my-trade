import { Middleware } from "@reduxjs/toolkit";
import { RootState } from "../store";

import { sendMessage } from "../../services/webSocket";
import { updateDrawings } from "../../utils/DrawingHistory";

export const serverStateUpdateMiddleware: Middleware =
  (store) => (next) => (action: any) => {
    const prevState = store.getState() as RootState;
    const result = next(action);
    const currentState = store.getState() as RootState;

    if (action.payload?.data?.fromServerState) {
      return result;
    }

    if (action.type.startsWith("states/") && action.payload.id === "drawings") {
      const prevDrawings = prevState.states.drawings;
      const currentDrawings = currentState.states.drawings;

      const hasDrawingsChangedSymbol = Object.keys(currentDrawings).find(
        (symbol) => prevDrawings[symbol] !== currentDrawings[symbol]
      );

      if (
        hasDrawingsChangedSymbol &&
        hasDrawingsChangedSymbol !== "id" &&
        JSON.stringify(currentDrawings[hasDrawingsChangedSymbol]) !==
          JSON.stringify(prevDrawings[hasDrawingsChangedSymbol])
      ) {
        // Update drawing history
        updateDrawings({
          symbol: hasDrawingsChangedSymbol,
          drawings: currentDrawings[hasDrawingsChangedSymbol],
        });

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

      const hasAlertsChangedDrawingId = Object.keys(currentAlerts).find(
        (drawingId) => prevAlerts[drawingId] !== currentAlerts[drawingId]
      );

      if (
        hasAlertsChangedDrawingId &&
        hasAlertsChangedDrawingId !== "id" &&
        JSON.stringify(currentAlerts[hasAlertsChangedDrawingId]) !==
          JSON.stringify(prevAlerts[hasAlertsChangedDrawingId])
      ) {
        sendMessage("alerts", {
          fromUiState: true,
          _db: true,
          [hasAlertsChangedDrawingId]: currentAlerts[hasAlertsChangedDrawingId],
        });
      }
    }

    return result;
  };
