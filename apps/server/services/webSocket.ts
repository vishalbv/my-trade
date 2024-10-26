import { WebSocketServer, WebSocket } from "ws";
import http from "http";
import notify from "./notification";

interface WebSocketMessage {
  event: string;
  data: any;
}

let wss: WebSocketServer;

export function initializeWebSocket(server: http.Server) {
  wss = new WebSocketServer({ server });

  wss.on("connection", (ws) => {
    console.log("New WebSocket connection");
    notify.success({ title: "WebSocket Connected", description: "dd" });

    ws.on("message", (message) => {
      try {
        const parsedMessage: WebSocketMessage = JSON.parse(message.toString());
        handleMessage(ws, parsedMessage);
      } catch (error) {
        console.error("Error parsing message:", error);
      }
    });

    ws.on("close", () => {
      console.log("WebSocket connection closed");
    });
  });
}

function handleMessage(ws: WebSocket, message: WebSocketMessage) {
  console.log(`Received ${message.event} event:`, message.data);

  switch (message.event) {
    case "app":
      handleAppEvent(message.data);
      break;
    case "message":
      broadcastMessage("message", message.data);
      break;
    // Add more custom events as needed
    default:
      console.warn(`Unhandled event type: ${message.event}`);
  }
}

function handleAppEvent(data: any) {
  // Handle app-specific logic here
  console.log("Handling app event:", data);
  // You might want to broadcast this to other clients or perform some server-side operations
  broadcastMessage("app", data);
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
export function sendState(id: string, data: any) {
  broadcastMessage(id, data);
}
