// @ts-ignore
import { fyersDataSocket } from "fyers-web-sdk-v3";
import { sendMessage } from "./webSocket";
import { store } from "../store/store";
import { updateFyersWebTick } from "../store/slices/ticksSlice";

let socketInstance: any = null;
let subscribedSymbolsBeforeConnect: Set<string> = new Set();

export const fyersDataSocketService = {
  connect: (accessToken: string) => {
    try {
      socketInstance = fyersDataSocket.getInstance(
        accessToken,
        "path/where/logs/to/be/saved"
      );
    } catch (error: any) {
      // Check for token expiration error
      if (error.message?.includes("expired token")) {
        sendMessage("fyers", {
          access_token: null,
        });
        // Redirect to home page
        window.location.href = "/"; // Using window.location for full page refresh
        // OR use router.push('/') if you're inside a component
      }
      throw error; // Re-throw the error for other error types
    }

    socketInstance.on("connect", () => {
      socketInstance.mode(socketInstance.LiteMode);
      console.log(socketInstance.isConnected());
      socketInstance.subscribe([...subscribedSymbolsBeforeConnect]);
    });

    socketInstance.on("message", (message: any) => {
      if (message && message.symbol) {
        store.dispatch(
          updateFyersWebTick({
            symbol: message.symbol,
            data: {
              ltp: message.ltp,
              timestamp: message.exch_feed_time,
              type: message.type,
              // Only including the fields that are actually present in your message
            },
          })
        );
      }
    });

    socketInstance.on("error", (message: any) => {
      console.log("erroris", message);
    });

    socketInstance.on("close", () => {
      console.log("socket closed");
    });

    socketInstance.connect();
    socketInstance.autoreconnect();

    return socketInstance;
  },

  subscribe: (symbols: string[]) => {
    if (socketInstance && socketInstance.isConnected()) {
      socketInstance.subscribe(symbols);
    } else {
      symbols.forEach((symbol) => subscribedSymbolsBeforeConnect.add(symbol));
      console.error("Socket not connected");
    }
  },

  unsubscribe: (symbols: string[]) => {
    if (socketInstance && socketInstance.isConnected() && symbols.length > 0) {
      socketInstance.unsubscribe(symbols);
    }
  },
};
