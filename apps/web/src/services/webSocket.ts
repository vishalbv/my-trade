import { setStatesByID, setStatesByIDAndKey } from "../store/slices/stateSlice";
import { updateShoonyaServerTick } from "../store/slices/ticksSlice";

import { allStates } from "../utils/constants";
import notify, { notifyServerSide } from "./notification";

let socket: WebSocket | null = null;
let dispatch: any = null;
let reconnectAttempts = 0;
const RECONNECT_DELAY = 3000;

function connect() {
  socket = new WebSocket("wss://my-trade-server.zeabur.app");

  socket.onopen = () => {
    console.log("WebSocket Connected");

    reconnectAttempts = 0; // Reset attempts on successful connection
  };

  socket.onclose = () => {
    console.log("WebSocket Disconnected");
    socket = null;

    console.log(`Attempting to reconnect in ${RECONNECT_DELAY}ms...`);
    setTimeout(() => {
      reconnectAttempts++;
      initializeWebSocket();
    }, RECONNECT_DELAY);
  };

  socket.onmessage = (response: MessageEvent<any>) => {
    const { event, data } = JSON.parse(response.data);

    if (event === "notification") {
      notifyServerSide(data);
    } else if (event === "ticks_shoonya_server") {
      dispatch(updateShoonyaServerTick(data));
    } else if (allStates.includes(event)) {
      console.log("setting states", event, data);
      const { _key, ...rest } = data;
      if (_key) {
        dispatch(setStatesByIDAndKey({ id: event, key: _key, data: rest }));
      } else {
        dispatch(setStatesByID({ id: event, data }));
      }
    }
  };

  socket.onerror = (error) => {
    console.error("WebSocket Error:", error);
  };

  return socket;
}

export function initializeWebSocket() {
  if (!socket) {
    socket = connect();
  }
  return socket;
}

export function getSocket(): WebSocket | null {
  return socket;
}

export function updateDispatch(fn: any) {
  dispatch = fn;
}

export function sendMessage(event: string, data: any) {
  if (socket && socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify({ event, data }));
  } else {
    console.error("WebSocket is not connected");
  }
}
