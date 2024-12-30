import notify from "../../services/notification";
import _drawings from "../drawings/index";
import { _fyersSocket } from "../fyers/socket";
import _alerts from "./index";

const filterCommonKeys = (obj: any) => {
  const { id, _id, updatedAt, checkAlerts, ...rest } = obj;
  return rest;
};

export const checkAlerts = () => {
  let intervalId: Timer;
  intervalId = setInterval(() => {
    const alerts = Object.values(filterCommonKeys(_alerts.getState())).flat();
    const drawings = Object.values(
      filterCommonKeys(_drawings.getState())
    ).flat();

    // console.log({ alerts, drawings });

    alerts.map((alert: any) => {
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
  }, 3000);

  const handleAlertCatch = (alert: any) => {
    notify.info("Alert caught priceTouch");
  };

  _alerts.setIntervalAndUpdate("checkAlerts", intervalId);
};
