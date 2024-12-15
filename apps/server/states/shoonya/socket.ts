import logger from "../../services/logger";
import NorenRestApi from "../../services/shoonyaApi/RestApi";
import { INDEX_DETAILS } from "@repo/utils/constants";
import { sendMessage } from "../../services/webSocket";
import _shoonya from "./index";
import { getNewTicks, getShoonyaPL } from "./functions";
import notify from "../../services/notification";

interface ShoonyaSocketState {
  _subscribed: string[];
  _socketReady: boolean;
  [key: string]: any; // For dynamic tick values
}

let $state: ShoonyaSocketState = {
  _subscribed: [],
  _socketReady: false,
};

// Store API instance
let apiInstance: NorenRestApi | null = null;

export const getState = () => $state;

export const setState = (newState: Partial<ShoonyaSocketState>) => {
  $state = { ...$state, ...newState };
};

export const subscribeTicks = async (ticks: string[]) => {
  console.log("subscribeTicks", ticks);
  if (!apiInstance) {
    logger.error("API instance not initialized");
    return;
  }

  if (!getState()._socketReady) {
    setTimeout(async () => {
      console.log("retrying to subscribe ticks", ticks);
      await subscribeTicks(ticks);
    }, 2000);
    return;
  }

  const newTicks = getNewTicks(getState()._subscribed, ticks);

  if (newTicks?.length > 0) {
    try {
      apiInstance.subscribe(newTicks.join("#"), "t");
      setState({ _subscribed: [...getState()._subscribed, ...newTicks] });
    } catch (e) {
      logger.error("error in shoonya subscribeTicks", e);
    }
  }
};

export const unsubscribeTicks = async (ticks: string[]) => {
  // Implement unsubscribe logic if needed
};

function receiveQuote(data: any) {
  if (data.lp) {
    let _data = {
      [data.tk]: { ...getState()[data.tk], ...data },
      _shoonyaPL: getShoonyaPL(_shoonya.getState().positions, getState()),
    };
    setState(_data);
    sendMessage("ticks_shoonya_server", _data);
    // Emit socket event if needed
  }
}

function handleOrderUpdate(order: any) {
  // Handle order updates
  console.log("order--outside", order);

  _shoonya.getOrderBook();
  if (order.status == "REJECTED") {
    logger.error(order);
    return notify.error(order.rejreason);
  } else if (order.status == "COMPLETE" || order.status == "COMPLETED") {
    console.log("order--inside", order);
    //TO-DO added delay to get positions and fund info

    setTimeout(() => {
      _shoonya.getPositions();
      _shoonya.getFundInfo();
    }, 500);
    setTimeout(() => {
      _shoonya.getPositions();
      _shoonya.getFundInfo();
    }, 1000);
    return notify.success({
      title: `Order placed: ${order.tsym}`,
      description: `${order.trantype == "S" ? "Sell" : "Buy"} ${order.qty} at ${order.avgprc}`,
    });
  }
}

function socketClose() {
  logger.info("shoonya socket closed");
  setState({ _socketReady: false });
}

const checkSocketRunning = () => {
  setTimeout(() => {
    if (!getState()._socketReady && apiInstance) {
      startShoonyaSocket(apiInstance, true);
    } else {
      checkSocketRunning();
    }
  }, 4000);
};

export const startShoonyaSocket = async (api: NorenRestApi, retry = false) => {
  if (retry) logger.info("trying to open shoonya socket again");

  // Store API instance for future use
  apiInstance = api;

  try {
    await api.startWebsocket({
      socket_open: () => {
        logger.info("shoonya socket opened");
        setState({ _socketReady: true });
        setTimeout(() => {
          subscribeTicks(
            Object.values(INDEX_DETAILS).map(
              (i: any) => i.indexExchange + "|" + i.shoonyaToken
            )
          );
        }, 1000);
      },
      quote: receiveQuote,
      socket_error: (error: Error) => {
        console.log("Socket error:", error);
        setState({ _socketReady: false });
      },
      socket_close: socketClose,
      order: handleOrderUpdate,
    });

    checkSocketRunning();
  } catch (e) {
    logger.error("error in shoonya startSocket", e);
  }
};

const pushInitialState = () => {
  sendMessage("ticks_shoonya_server", getState());
};

// Export other necessary functions
export const _shoonyaSocket = {
  getState,
  setState,
  subscribeTicks,
  unsubscribeTicks,
  startShoonyaSocket,
  pushInitialState,
};
