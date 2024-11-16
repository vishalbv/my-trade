import { type Server, type ServerWebSocket } from "bun";
import { declareApis } from "../apis";
import _app from "../states/app/index";
import { _allStates } from "../states/allstates";
import { checkLoginSession } from "../utils/helpers";
import logger from "./logger";

interface WebSocketMessage {
  event: string;
  data: any;
}

let wss: Server;
const clients: Set<ServerWebSocket<{ authToken: string }>> = new Set();

const pushInitialState = async () => {
  if (_app.getState().loggedIn) {
    Object.values(_allStates).forEach((i) => {
      i.pushState();
    });
  }
};

export function initializeWebSocket() {
  const apiHandlers = declareApis();

  wss = Bun.serve<{ authToken: string }>({
    port: process.env.PORT || 2300,
    async fetch(req, server) {
      // Handle WebSocket upgrade
      if (req.headers.get("upgrade") === "websocket") {
        const success = server.upgrade(req);
        if (success) return undefined;
      }

      // Handle CORS preflight
      if (req.method === "OPTIONS") {
        return new Response(null, {
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, Authorization",
          },
        });
      }

      // Add CORS headers to all responses
      const corsHeaders = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      };

      try {
        const url = new URL(req.url);
        const urlParams = url.pathname.split("/").filter(Boolean);
        const params = { id: urlParams[urlParams.length - 1] }; // Assumes ID is the last URL segment

        const handler =
          apiHandlers[
            `${req.method} ${url.pathname}` as keyof typeof apiHandlers
          ];

        if (handler) {
          const body = req.method !== "GET" ? await req.json() : undefined;
          const response = await handler({ body, params });
          return new Response(JSON.stringify(response), {
            headers: {
              "Content-Type": "application/json",
              ...corsHeaders,
            },
          });
        }

        return new Response("Not Found", { status: 404, headers: corsHeaders });
      } catch (error) {
        return new Response(
          JSON.stringify({
            status: 500,
            message:
              error instanceof Error ? error.message : "Internal Server Error",
          }),
          {
            status: 500,
            headers: {
              "Content-Type": "application/json",
              ...corsHeaders,
            },
          }
        );
      }
    },
    websocket: {
      open(ws: ServerWebSocket<{ authToken: string }>) {
        clients.add(ws);
        logger.info(`WebSocket connected. Total clients: ${clients.size}`);
        sendMessage("app", { loggedIn: _app.getState().loggedIn });
        checkLoginSession(pushInitialState);
      },
      message(ws, message) {
        try {
          const parsedMessage: WebSocketMessage = JSON.parse(
            message.toString()
          );
          logger.info("Received message:", parsedMessage);
          handleMessage(parsedMessage);
        } catch (error) {
          logger.error("Error parsing message:", error);
        }
      },
      close(ws: ServerWebSocket<{ authToken: string }>, code, reason) {
        clients.delete(ws);
        logger.info(`WebSocket closed. Code: ${code}, Reason: ${reason}`);
      },
    },
  });

  logger.info(`Server initialized on port ${wss.port}`);
  return wss;
}

function handleMessage(message: WebSocketMessage) {
  switch (message.event) {
    case "notification":
      handleNotificationEvent(message);
      break;
    default:
      handleStateEvent(message?.event as keyof typeof _allStates, message.data);
  }
}

const handleStateEvent = (event: keyof typeof _allStates, data: any) => {
  _allStates[event]?.setState(data);
};

function handleNotificationEvent(data: any) {
  // You might want to broadcast this to other clients or perform some server-side operations
}

export function broadcastMessage(event: string, data: any) {
  const message: WebSocketMessage = { event, data };
  logger.info(`Broadcasting message to ${clients.size} clients:`, message);

  const messageString = JSON.stringify(message);
  clients.forEach((client) => {
    try {
      if (client.readyState === 1) {
        client.send(messageString);
        logger.info("Message sent successfully to a client");
      } else {
        logger.warn(`Client in unexpected state: ${client.readyState}`);
      }
    } catch (error) {
      logger.error("Error sending message to client:", error);
    }
  });
}

export function sendMessage(event: string, data: any) {
  broadcastMessage(event, data);
}
