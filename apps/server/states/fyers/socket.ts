import logger from "../../services/logger";
import { INDEX_DETAILS } from "@repo/utils/constants";
import { sendMessage } from "../../services/webSocket";
import _fyers from "./index";
import {
  fyersDataSocket,
  fyersOrderSocket as FyersOrderSocket,
} from "fyers-api-v3";
import notify from "../../services/notification";
import { EventEmitter } from "events";

interface FyersSocketState {
  _subscribed: string[];
  _socketReady: boolean;
  [key: string]: any; // For dynamic tick values
}

let $state: FyersSocketState = {
  _subscribed: [],
  _socketReady: false,
};

let fyersdata: any = null;
let fyersOrders: any = null;
export const getState = () => $state;

export const setState = (newState: Partial<FyersSocketState>) => {
  $state = { ...$state, ...newState };
};

export const priceEventEmitter = new EventEmitter();

function onMessage(message: any) {
  // Instead of directly calling functions, emit an event
  priceEventEmitter.emit("priceUpdate", {
    symbol: message.symbol,
    ltp: message.ltp,
  });
}

function onConnect() {
  logger.info("Fyers socket connected");
  setState({ _socketReady: true });
  setMode("lite");
  // Subscribe to indices
  try {
    subscribeTicks(["NSE:TCS-EQ"]);
  } catch (error) {
    logger.error("Error subscribing to indices:", error);
  }
}

function onOrders(message: any) {
  console.log("onOrders", message);
}

function onError(error: any) {
  logger.error("Fyers socket error:", error);
  setState({ _socketReady: false });
  notify.error("Fyers connection error");
}

function onClose(e: any) {
  logger.info("Fyers socket closed", e);
  setState({ _socketReady: false });
}

export const startFyersSocket = (accessToken: string) => {
  try {
    if (fyersdata) {
      fyersdata.close();
    }

    fyersdata = fyersDataSocket.getInstance(accessToken);

    // Set up event handlers
    fyersdata.on("message", onMessage);
    fyersdata.on("connect", onConnect);
    fyersdata.on("error", onError);
    fyersdata.on("close", onClose);

    // Enable auto-reconnect
    fyersdata.autoreconnect(5); // 5 reconnection attempts

    // Connect to socket
    fyersdata.connect();

    fyersOrders = new FyersOrderSocket(accessToken);

    // Set up event handlers
    fyersOrders.on("orders", onOrders);
    fyersOrders.on("trades", function (msg: any) {
      console.log("trades", msg);
    });
    fyersOrders.on("connect", onConnect);
    fyersOrders.on("positions", function (msg: any) {
      console.log("positions", msg);
    });
    fyersOrders.on("error", onError);
    fyersOrders.on("close", onClose);

    // Enable auto-reconnect
    // fyersOrders.autoreconnect(5); // 5 reconnection attempts

    // // Connect to socket
    // fyersOrders.connect();
  } catch (error) {
    logger.error("Error starting Fyers socket:", error);
    notify.error("Failed to start Fyers connection");
  }
};

export const subscribeTicks = async (symbols: string[]) => {
  // if (!fyersdata || !getState()._socketReady) {
  //   logger.error("Fyers socket not ready");
  //   return;
  // }

  const toSubscribe = symbols.filter(
    (symbol) => !getState()._subscribed.includes(symbol)
  );

  console.log(fyersdata, "fyersdata");
  if (toSubscribe.length > 0) {
    try {
      fyersdata.subscribe([...toSubscribe]);
      setState({
        _subscribed: [...getState()._subscribed, ...toSubscribe],
      });
      logger.info("Subscribed to Fyers symbols:", symbols);
    } catch (error) {
      logger.error("Error subscribing to Fyers ticks:", error);
    }
  }
};

export const unsubscribeTicks = async (symbols: string[]) => {
  if (!fyersdata || !getState()._socketReady) return;

  try {
    fyersdata.unsubscribe([...symbols]);
    logger.info("Unsubscribed from Fyers symbols:", symbols);
  } catch (error) {
    logger.error("Error unsubscribing from Fyers ticks:", error);
  }
};

export const setMode = (mode: "lite" | "full") => {
  if (!fyersdata || !getState()._socketReady) return;

  try {
    fyersdata.mode(mode === "lite" ? fyersdata.LiteMode : fyersdata.FullMode);
    logger.info(`Set Fyers mode to ${mode}`);
  } catch (error) {
    logger.error("Error setting Fyers mode:", error);
  }
};

const pushInitialState = () => {
  sendMessage("ticks_fyers_server", getState());
};

export const _fyersSocket = {
  getState,
  setState,
  subscribeTicks,
  unsubscribeTicks,
  startFyersSocket,
  setMode,
  pushInitialState,
};
