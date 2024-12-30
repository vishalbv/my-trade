import { Middleware } from "@reduxjs/toolkit";
import { RootState } from "../store";

import { sendMessage } from "../../services/webSocket";
import { updateDrawings } from "../../utils/DrawingHistory";

export const serverStateUpdateMiddleware: Middleware =
  (store) => (next) => (action) => {
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

    return result;
  };
