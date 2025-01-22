import { initializeWebSocket } from "./services/webSocket";
import { startDbService } from "./services/db";
import { checkLoginSession } from "./utils/helpers";
import initializeApp from "./states/app/app-initialize";
import "./states/fyers/priceHandlers";

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

// Initialize WebSocket server with HTTP handling
const server = initializeWebSocket();

checkLoginSession(initializeApp);

console.log(`Server listening on port ${server.port}`);
