import { WebSocketServer, WebSocket } from "ws";
import http from "http";
import notify from "./notification";
import _app from "../states/app/index";
import { _allStates } from "../states/allstates";
import { checkLoginSession } from "../utils/helpers";
import logger from "./logger";

interface WebSocketMessage {
  event: string;
  data: any;
}

let wss: WebSocketServer;

const pushInitialState = async () => {
  if (_app.getState().loggedIn) {
    Object.values(_allStates).forEach((i) => {
      i.pushState();
    });
    // _ticksShoonyaService.pushState();
    // _notifications.pushState();
  }
  // _ticksService2.pushState();
};

export function initializeWebSocket(server: http.Server) {
  wss = new WebSocketServer({ server });

  wss.on("connection", (ws) => {
    logger.info("New WebSocket connection");
    sendMessage("app", { loggedIn: _app.getState().loggedIn });
    ws.on("message", (message) => {
      try {
        const parsedMessage: WebSocketMessage = JSON.parse(message.toString());
        handleMessage(ws, parsedMessage);
      } catch (error) {
        logger.error("Error parsing message:", error);
      }
    });

    ws.on("close", () => {
      logger.info("WebSocket connection closed");
    });
    checkLoginSession(pushInitialState);
  });
}

function handleMessage(ws: WebSocket, message: WebSocketMessage) {
  switch (message.event) {
    case "notification":
      handleNotificationEvent(message);
      break;
    default:
      handleStateEvent(message.event, message.data);
  }
}

const handleStateEvent = (event: string, data: any) => {
  _allStates[event]?.setState(data);
};

function handleNotificationEvent(data: any) {
  // You might want to broadcast this to other clients or perform some server-side operations
}

export function broadcastMessage(event: string, data: any) {
  const message: WebSocketMessage = { event, data };
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(message));
    }
  });
}

export function sendMessage(event: string, data: any) {
  broadcastMessage(event, data);
}
