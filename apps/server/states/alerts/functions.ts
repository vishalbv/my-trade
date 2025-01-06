import notify from "../../services/notification";
import _app from "../app/index";
import _drawings from "../drawings/index";
import { _fyersSocket } from "../fyers/socket";
import _alerts from "./index";

export const filterCommonKeys = (obj: any) => {
  const { id, _id, updatedAt, checkAlerts, ...rest } = obj;
  return rest;
};

export const checkAlerts = () => {
  let intervalId: Timer;

  intervalId = setInterval(() => {
    if (_app.getState().marketStatus.activeStatus) {
      alertFinder();
    }
  }, 2000);

  const alertFinder = () => {
    const alerts = Object.values(filterCommonKeys(_alerts.getState())).flat();
    const drawings = Object.values(
      filterCommonKeys(_drawings.getState())
    ).flat();

    const subScribeSymbols = [
      ...new Set(alerts.map((alert: any) => alert.symbol)),
    ];
    _fyersSocket.subscribeTicks(subScribeSymbols);

    alerts.forEach((alert: any) => {
      if (alert.notified) return;
      if (alert.timeframe === "") {
        const drawing = drawings.find((d: any) => d.id === alert.drawingId);

        if (drawing?.type === "horizontalLine") {
          if (alert.type === "priceTouch") {
            const alertPrice = drawing.points[0].y;

            if (
              alert?.tickDataAtCreation?.ltp > alertPrice &&
              _fyersSocket.getState()[alert.symbol]?.ltp <= alertPrice
            ) {
              handleAlertCatch(alert);
            } else if (
              alert?.tickDataAtCreation?.ltp < alertPrice &&
              _fyersSocket.getState()[alert?.symbol]?.ltp >= alertPrice
            ) {
              handleAlertCatch(alert);
            }
          }
        }
      }
    });
  };

  const handleAlertCatch = (alert: any) => {
    notify.info({ description: "Alert caught priceTouch", speak: true });
    _alerts.updateAlert(alert.drawingId, alert.id, { notified: true });
  };

  _alerts.setIntervalAndUpdate("checkAlerts", intervalId);
};
