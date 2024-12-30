import { cloneDeep } from "lodash";
import { Drawing } from "../components/Chart/types";
import { updateDrawings as updateDrawingsToState } from "../store/actions/drawingActions";
import { Dispatch } from "@reduxjs/toolkit";

interface DrawingHistoryState {
  past: Drawing[][];
  present: Drawing[];
  future: Drawing[][];
}

interface HistoryStorage {
  [symbol: string]: DrawingHistoryState;
}

const STORAGE_KEY = "drawingHistory";

// Helper functions for sessionStorage
const getHistory = (): HistoryStorage => {
  try {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch (error) {
    console.error("Error reading drawing history:", error);
    return {};
  }
};

const saveHistory = (history: HistoryStorage): void => {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(history));
  } catch (error) {
    console.error("Error saving drawing history:", error);
  }
};

export const initializeHistory = (
  symbol: string,
  drawings: Drawing[]
): void => {
  const history = getHistory();
  if (!history[symbol]) {
    history[symbol] = {
      past: [],
      present: drawings,
      future: [],
    };
    saveHistory(history);
  }
};

export const updateDrawings = ({ symbol, drawings }): void => {
  const history = getHistory();
  if (!history[symbol]) {
    history[symbol] = {
      past: [[]],
      present: drawings,
      future: [],
    };
  } else {
    history[symbol].past = cloneDeep([
      ...history[symbol].past,
      history[symbol].present,
    ]);
    history[symbol].present = drawings;
    history[symbol].future = [];
  }
  saveHistory(history);
};

export const undo = (symbol: string) => (dispatch: Dispatch) => {
  const history = getHistory();
  if (!history[symbol]) return;

  const currentState = history[symbol];

  // First, update the UI state immediately
  let newDrawings: Drawing[] = [];

  if (currentState.past.length > 0) {
    newDrawings = [...currentState.past[currentState.past.length - 1]];
  }

  // Dispatch UI update first
  dispatch(
    updateDrawingsToState({
      symbol,
      drawings: newDrawings,
    })
  );

  // Then update the history storage
  const newState = {
    past: currentState.past.length > 0 ? currentState.past.slice(0, -1) : [],
    present: newDrawings,
    future:
      currentState.present.length > 0
        ? [[...currentState.present], ...currentState.future]
        : currentState.future,
  };

  history[symbol] = newState;
  saveHistory(history);
};

export const redo = (symbol: string) => (dispatch: Dispatch) => {
  const history = getHistory();
  if (!history[symbol]) return;

  const currentState = history[symbol];
  if (currentState.future.length === 0) return;

  // First, update the UI state immediately
  let newDrawings: Drawing[] = [];

  if (currentState.future.length > 0) {
    newDrawings = [...currentState.future[0]];
  }

  // Dispatch UI update first
  dispatch(
    updateDrawingsToState({
      symbol,
      drawings: newDrawings,
    })
  );

  // Then update the history storage
  const newState = {
    past:
      currentState.present.length > 0
        ? [...currentState.past, [...currentState.present]]
        : currentState.past,
    present: newDrawings,
    future: currentState.future.slice(1),
  };

  history[symbol] = newState;
  saveHistory(history);
};

export const getCurrentDrawings = (symbol: string): Drawing[] | null => {
  const history = getHistory();
  return history[symbol]?.present || null;
};
