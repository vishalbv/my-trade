import { setStatesByID } from "../store/reducerActions/rootReducer";
import store from "../store/store";
import { allStates } from "../utils/constants";
import notify, { notifyServerSide } from "./notification";

let socket: WebSocket | null = null;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 5;
const INITIAL_RECONNECT_DELAY = 1000;
const dispatch = store.dispatch;

function connect() {
  socket = new WebSocket("ws://localhost:2300");

  socket.onopen = () => {
    console.log("WebSocket Connected");

    reconnectAttempts = 0; // Reset attempts on successful connection
  };

  socket.onclose = () => {
    console.log("WebSocket Disconnected");
    socket = null;

    // Attempt to reconnect with exponential backoff
    if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
      const delay = INITIAL_RECONNECT_DELAY * Math.pow(2, reconnectAttempts);
      console.log(`Attempting to reconnect in ${delay}ms...`);

      setTimeout(() => {
        reconnectAttempts++;
        initializeWebSocket();
      }, delay);
    } else {
      notify.error("Failed to reconnect to WebSocket after multiple attempts");
    }
  };

  socket.onmessage = (response: MessageEvent<any>) => {
    console.log("Received:", response.data);

    const { event, data } = JSON.parse(response.data);
    console.log("event", event);

    if (event === "notification") {
      notifyServerSide(data);
    } else if (allStates.includes(event)) {
      console.log("setting states", event, data);
      dispatch(setStatesByID({ id: event, data }));
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

export function sendMessage(event: string, data: any) {
  if (socket && socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify({ event, data }));
  } else {
    console.error("WebSocket is not connected");
  }
}
