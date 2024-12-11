import { AppDispatch } from "../store";

import { Alert, Drawing } from "../../components/Chart/types";
import {
  addItemToKeyOfId,
  clearItemsInKeyOfId,
  deleteItemInKeyOfId,
  updateItemInKeyOfId,
} from "../slices/stateSlice";

export const addAlert =
  ({ drawingId, alert }: { drawingId: string; alert: Alert }) =>
  (dispatch: AppDispatch) => {
    dispatch(addItemToKeyOfId({ id: "alerts", key: drawingId, data: alert }));
  };
export const updateAlert =
  ({ drawingId, alert }: { drawingId: string; alert: Partial<Alert> }) =>
  (dispatch: AppDispatch) => {
    dispatch(
      updateItemInKeyOfId({ id: "alerts", key: drawingId, data: alert })
    );
  };

export const deleteAlert =
  ({ drawingId, alertId }: { drawingId: string; alertId: string }) =>
  (dispatch: AppDispatch) => {
    dispatch(
      deleteItemInKeyOfId({
        id: "alerts",
        key: drawingId,
        data: { id: alertId },
      })
    );
  };

export const clearAlerts = (drawing: Drawing) => (dispatch: AppDispatch) => {
  dispatch(clearItemsInKeyOfId({ id: "alerts", key: drawing.id }));
};
