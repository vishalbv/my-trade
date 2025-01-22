import { checkAlertForPriceTouch } from "../alerts/functions";
import { checkOpenOrders } from "../app/ordersManage";
import { priceEventEmitter } from "./socket";

// Set up listeners
priceEventEmitter.on("priceUpdate", ({ symbol, ltp }) => {
  checkAlertForPriceTouch({ symbol, ltp });
  checkOpenOrders({ symbol, ltp });
});
