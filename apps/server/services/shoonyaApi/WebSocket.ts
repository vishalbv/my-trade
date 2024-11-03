// @ts-nocheck

import WebSocket from "ws";
import { API } from "./config.js";

const triggers = {
  open: [],
  quote: [],
  order: [],
};

// Helper function to trigger event callbacks
const trigger = (e, args) => {
  if (!triggers[e]) return;
  triggers[e].forEach((callback) => callback.apply(callback, args || []));
};

class WebSocketClient {
  #ws = null;
  #apikey;
  #url;
  #timeout;

  constructor(cred) {
    this.#apikey = cred.apikey;
    this.#url = cred.url;
    this.#timeout = API.heartbeat || 3000;
  }

  async connect(params, callbacks) {
    if (!this.#apikey || !this.#url) {
      throw new Error("apikey or url is missing");
    }

    return new Promise((resolve, reject) => {
      this.#setCallbacks(callbacks);

      this.#ws = new WebSocket(this.#url, null, { rejectUnauthorized: false });

      this.#ws.onopen = () => {
        setInterval(() => {
          this.#ws.send('{"t":"h"}');
        }, this.#timeout);

        const values = {
          t: "c",
          uid: params.uid,
          actid: params.actid,
          susertoken: params.apikey,
          source: "API",
        };

        this.#ws.send(JSON.stringify(values));
        resolve();
      };

      this.#ws.onmessage = (evt) => {
        const result = JSON.parse(evt.data);
        console.log(result);

        switch (result.t) {
          case "ck":
            trigger("open", [result]);
            break;
          case "tk":
          case "tf":
          case "dk":
          case "df":
            trigger("quote", [result]);
            break;
          case "om":
            trigger("order", [result]);
            break;
        }
      };

      this.#ws.onerror = (evt) => {
        console.log("error::", evt);
        trigger("error", [JSON.stringify(evt.data)]);
        this.connect();
        reject(evt);
      };

      this.#ws.onclose = (evt) => {
        console.log("Socket closed");
        trigger("close", [JSON.stringify(evt.data)]);
      };
    });
  }

  #setCallbacks(callbacks) {
    const callbackMap = {
      socket_open: "open",
      socket_close: "close",
      socket_error: "error",
      quote: "quote",
      order: "order",
    };

    Object.entries(callbackMap).forEach(([key, event]) => {
      if (callbacks[key]) {
        this.on(event, callbacks[key]);
      }
    });
  }

  send(data) {
    if (!this.#ws) throw new Error("WebSocket not connected");
    this.#ws.send(data);
  }

  on(event, callback) {
    if (triggers.hasOwnProperty(event)) {
      triggers[event].push(callback);
    }
  }

  close() {
    if (this.#ws) {
      this.#ws.close();
    }
  }
}

export default WebSocketClient;
