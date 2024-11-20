// @ts-ignore
import { fyersDataSocket } from "fyers-web-sdk-v3";
import { sendMessage } from "./webSocket";
import { store } from "../store/store";
import { updateFyersWebTick } from "../store/slices/ticksSlice";

let socketInstance: any = null;

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
      socketInstance.subscribe(["NSE:NIFTY50-INDEX", "NSE:SBIN-EQ"]);
    });

    socketInstance.on("message", (message: any) => {
      console.log({ TEST: message });
      // if (message && message.symbol) {
      //   store.dispatch(
      //     updateFyersWebTick({
      //       symbol: message.symbol,
      //       data: {
      //         ltp: message.ltp,
      //         volume: message.volume,
      //         high: message.high,
      //         low: message.low,
      //         timestamp: message.timestamp,
      //         // Add other relevant data from the message
      //       },
      //     })
      //   );
      // }
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
      console.error("Socket not connected");
    }
  },

  unsubscribe: (symbols: string[]) => {
    if (socketInstance && socketInstance.isConnected()) {
      socketInstance.unsubscribe(symbols);
    }
  },
};
