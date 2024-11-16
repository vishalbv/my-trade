// @ts-ignore
import { fyersDataSocket } from "fyers-web-sdk-v3";

let socketInstance: any = null;

export const fyersDataSocketService = {
  connect: (accessToken: string) => {
    socketInstance = fyersDataSocket.getInstance(
      accessToken,
      "path/where/logs/to/be/saved"
    );

    socketInstance.on("connect", () => {
      socketInstance.mode(socketInstance.LiteMode);
      console.log(socketInstance.isConnected());
      socketInstance.subscribe(["NSE:NIFTY50-INDEX", "NSE:SBIN-EQ"]);
    });

    socketInstance.on("message", (message: any) => {
      console.log({ TEST: message });
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
