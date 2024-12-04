import logger from "../../services/logger";
import NorenRestApi from "../../services/shoonyaApi/RestApi";
import { INDEX_DETAILS } from "@repo/utils/constants";
import { sendMessage } from "../../services/webSocket";
import _shoonya from "./index";
import { getNewTicks, getShoonyaPL } from "./functions";

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
  console.log("Order Update:", order);
}

function socketClose() {
  logger.info("shoonya socket closed");
  setState({ _socketReady: false });
}

const checkSocketRunning = () => {
  setTimeout(() => {
    if (!getState()._socketReady && apiInstance) {
      startShoonyaSocket(apiInstance, true);
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

// Export other necessary functions
export const shoonyaSocket = {
  getState,
  setState,
  subscribeTicks,
  unsubscribeTicks,
  startShoonyaSocket,
};
