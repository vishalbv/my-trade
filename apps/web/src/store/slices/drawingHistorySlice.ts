import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { Drawing } from "../../components/Chart/types";

interface DrawingHistoryState {
  history: {
    [symbol: string]: {
      past: Drawing[][]; // Stack of past drawing states
      future: Drawing[][]; // Stack of future drawing states
      present: Drawing[]; // Current drawing state
    };
  };
}

const DRAWING_HISTORY_KEY = "drawingHistory";

// Helper functions for sessionStorage
const getHistoryFromStorage = (): DrawingHistoryState["history"] => {
  try {
    const stored = sessionStorage.getItem(DRAWING_HISTORY_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch (error) {
    console.error("Error reading drawing history from sessionStorage:", error);
    return {};
  }
};

const saveHistoryToStorage = (history: DrawingHistoryState["history"]) => {
  try {
    sessionStorage.setItem(DRAWING_HISTORY_KEY, JSON.stringify(history));
  } catch (error) {
    console.error("Error saving drawing history to sessionStorage:", error);
  }
};

const initialState: DrawingHistoryState = {
  history: getHistoryFromStorage(),
};

const drawingHistorySlice = createSlice({
  name: "drawingHistory",
  initialState,
  reducers: {
    initializeHistory: (
      state,
      action: PayloadAction<{ symbol: string; drawings: Drawing[] }>
    ) => {
      const { symbol, drawings } = action.payload;
      if (!state.history[symbol]) {
        state.history[symbol] = {
          past: [],
          present: drawings,
          future: [],
        };
        saveHistoryToStorage(state.history);
      }
    },
    updateDrawings: (
      state,
      action: PayloadAction<{ symbol: string; drawings: Drawing[] }>
    ) => {
      const { symbol, drawings } = action.payload;
      if (state.history[symbol]) {
        state.history[symbol].past.push([...state.history[symbol].present]);
        state.history[symbol].present = drawings;
        state.history[symbol].future = [];
      } else {
        state.history[symbol] = {
          past: [],
          present: drawings,
          future: [],
        };
      }
      saveHistoryToStorage(state.history);
    },
    undo: (state, action: PayloadAction<string>) => {
      const symbol = action.payload;
      const symbolHistory = state.history[symbol];

      if (symbolHistory && symbolHistory.past.length > 0) {
        const previous = symbolHistory.past[symbolHistory.past.length - 1];
        const newPast = symbolHistory.past.slice(0, -1);

        symbolHistory.future.unshift([...symbolHistory.present]);
        symbolHistory.present = previous;
        symbolHistory.past = newPast;

        saveHistoryToStorage(state.history);
      }
    },
    redo: (state, action: PayloadAction<string>) => {
      const symbol = action.payload;
      const symbolHistory = state.history[symbol];

      if (symbolHistory && symbolHistory.future.length > 0) {
        const next = symbolHistory.future[0];
        const newFuture = symbolHistory.future.slice(1);

        symbolHistory.past.push([...symbolHistory.present]);
        symbolHistory.present = next;
        symbolHistory.future = newFuture;

        saveHistoryToStorage(state.history);
      }
    },
  },
});

export const { initializeHistory, updateDrawings, undo, redo } =
  drawingHistorySlice.actions;
export default drawingHistorySlice.reducer;
