import { AppDispatch } from "../store";
import { deleteSelectedDrawing as deleteSelectedDrawingGlobalChart } from "../slices/globalChartSlice";
import { Drawing } from "../../components/Chart/types";
import {
  addItemToKeyOfId,
  clearItemsInKeyOfId,
  deleteItemInKeyOfId,
  updateItemInKeyOfId,
} from "../slices/stateSlice";

interface SelectedDrawing {
  symbol: string;
  drawing: Drawing;
}

export const addDrawing =
  ({ symbol, drawing }: { symbol: string; drawing: Drawing }) =>
  (dispatch: AppDispatch) => {
    dispatch(addItemToKeyOfId({ id: "drawings", key: symbol, data: drawing }));
  };
export const updateDrawing =
  ({ symbol, drawing }: { symbol: string; drawing: Drawing }) =>
  (dispatch: AppDispatch) => {
    dispatch(
      updateItemInKeyOfId({ id: "drawings", key: symbol, data: drawing })
    );
  };

export const deleteDrawing =
  ({ symbol, drawingId }: { symbol: string; drawingId: string }) =>
  (dispatch: AppDispatch) => {
    dispatch(
      deleteItemInKeyOfId({
        id: "drawings",
        key: symbol,
        data: { id: drawingId },
      })
    );
  };

export const clearDrawings = (symbol: string) => (dispatch: AppDispatch) => {
  dispatch(clearItemsInKeyOfId({ id: "drawings", key: symbol }));
};

export const deleteSelectedDrawing =
  (selectedDrawing: SelectedDrawing) => (dispatch: any) => {
    const { symbol, drawing } = selectedDrawing;
    dispatch(deleteDrawing({ symbol, drawingId: drawing.id }));
    dispatch(deleteSelectedDrawingGlobalChart());
  };
