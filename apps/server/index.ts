import express from "express";
import http from "http";
import cors from "cors";
import { initializeWebSocket } from "./services/webSocket";

import { startDbService } from "./services/db";
import { declareApis } from "./apis";
import { checkAllLoginStatus } from "@repo/utils/server/helpers";
import { checkLoginSession } from "./utils/helpers";
import initializeApp from "./states/app/app-initialize";

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

try {
  await startDbService();
} catch (error: any) {
  console.error(
    "[%s] Database connection error:",
    new Date().toLocaleTimeString(),
    error.message
  );

  // Add retry logic
  let retries = 3;
  while (retries > 0) {
    try {
      console.log(`Retrying database connection... (${retries} attempts left)`);
      await new Promise((resolve) => setTimeout(resolve, 5000)); // Wait 5 seconds
      await startDbService();
      console.log("Successfully connected to database after retry!");
      break;
    } catch (retryError) {
      retries--;
      if (retries === 0) {
        console.error("Failed to connect to database after all retry attempts");
        process.exit(1);
      }
    }
  }
}

initializeWebSocket(server);
declareApis(app);
console.log("checkLoginSession");
checkLoginSession(initializeApp);

const port = process.env.PORT || 2300;
server.listen(
  {
    port: port,
    host: "127.0.0.1",
  },
  () => {
    const addr = server.address();
    console.log(
      `Server listening at`,
      typeof addr === "string" ? addr : `http://${addr?.address}:${addr?.port}`
    );
  }
);
