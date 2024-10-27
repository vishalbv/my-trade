import express from "express";
import http from "http";
import cors from "cors";
import { initializeWebSocket, sendState } from "./services/webSocket";

import { startDbService } from "./services/db";
import { declareApis } from "./apis";

const app = express();
const server = http.createServer(app);

// Add CORS middleware
app.use(cors());
// app.use(cors({
//   origin: 'http://example.com',
//   methods: ['GET', 'POST', 'PUT', 'DELETE'],
//   allowedHeaders: ['Content-Type', 'Authorization']
// }));
app.use(express.json());

initializeWebSocket(server);

declareApis(app);
startDbService();
const port = process.env.PORT || 2300;
server.listen(port, () => {
  console.log(`Server at http://localhost:${port}`);
});
