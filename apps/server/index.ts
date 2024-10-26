import express from "express";
import http from "http";
import {
  initializeWebSocket,
  broadcastMessage,
  sendMessage,
  sendState,
} from "./services/webSocket";

const app = express();
const server = http.createServer(app);
import { APP_ENV } from "@repo/utils/constants";

initializeWebSocket(server);
console.log(APP_ENV);
setInterval(() => {
  console.log("Sending state");
  sendState("1", { name: "John", age: 30 });
}, 3000);

app.get("/", (req, res) => {
  res.send("Hello from Bun Express in Turborepo");
});

// Example of sending a message from the server
app.get("/send-message", (req, res) => {
  const message = req.query.message as string;
  sendMessage(`Server: ${message}`);
  res.send("Message sent");
});

const port = process.env.PORT || 2300;
server.listen(port, () => {
  console.log(`Server at http://localhost:${port}`);
});
