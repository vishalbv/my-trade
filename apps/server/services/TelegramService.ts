import axios from "axios";
import logger from "./logger";
import _app from "../states/app/index";
import { checkLoginSession } from "../utils/helpers";
import notify from "./notification";
import { _shoonyaSocket } from "../states/shoonya/socket";

interface TelegramUpdate {
  update_id: number;
  message?: {
    text?: string;
    chat?: {
      id: number;
    };
  };
}

type CommandHandler = (args?: string) => Promise<void>;

class TelegramService {
  private botToken: string;
  private chatId: string;
  private baseUrl: string;
  private lastUpdateId: number = 0;
  private commandHandlers: Map<string, CommandHandler>;
  private pollingInterval: Timer | null = null;
  private isPolling: boolean = false;
  private reconnectAttempts: number = 0;
  private readonly MAX_RECONNECT_ATTEMPTS = 5;
  private readonly POLLING_INTERVAL = 2000;
  private readonly RECONNECT_DELAY = 5000;
  private isInitialized: boolean = false;

  constructor() {
    this.botToken =
      process.env.TELEGRAM_BOT_TOKEN ||
      "8006085986:AAHHNucFVXQrASs6m7YqQUOK7bbqBfIiJGY";
    this.chatId = process.env.TELEGRAM_CHAT_ID || "1032590679";
    this.baseUrl = `https://api.telegram.org/bot${this.botToken}`;

    // Initialize command handlers
    this.commandHandlers = new Map<string, CommandHandler>([
      ["logoutapp", this.handleLogout],
      ["status", this.handleStatus],
      ["positions", this.handlePositions],
      ["pnl", this.handlePnL],
      ["help", this.handleHelp],
      ["start", this.handleStart],
    ]);

    this.initialize();
  }

  private async initialize() {
    try {
      // First delete any existing webhook
      await this.deleteWebhook();
      // Then start polling
      await this.startPolling();
      logger.info("Telegram bot initialized successfully");
    } catch (error) {
      logger.error("Failed to initialize Telegram bot:", error);
      this.handleReconnect();
    }
  }

  private async handleReconnect() {
    if (this.reconnectAttempts < this.MAX_RECONNECT_ATTEMPTS) {
      this.reconnectAttempts++;
      logger.info(
        `Attempting to reconnect (${this.reconnectAttempts}/${this.MAX_RECONNECT_ATTEMPTS})...`
      );
      setTimeout(() => this.initialize(), this.RECONNECT_DELAY);
    } else {
      logger.error(
        "Max reconnection attempts reached. Telegram bot is offline."
      );
    }
  }

  private async startPolling() {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
    }

    this.reconnectAttempts = 0;

    try {
      // Clear any pending updates first
      await this.getUpdates();
      logger.info("Started polling for Telegram messages");

      this.pollingInterval = setInterval(async () => {
        if (this.isPolling) {
          return;
        }

        try {
          this.isPolling = true;
          const updates = await this.getUpdates();
          logger.info(`Received ${updates.length} updates from Telegram`);

          for (const update of updates) {
            try {
              if (update.message?.text) {
                logger.info(`Processing message: ${update.message.text}`);
                await this.handleUpdate(update);
              }
            } catch (error) {
              logger.error(`Error handling update:`, error);
            }
          }
        } catch (error) {
          logger.error("Error in polling cycle:", error);
        } finally {
          this.isPolling = false;
        }
      }, 3000); // Poll more frequently - every 1 second
    } catch (error) {
      logger.error("Error starting polling:", error);
      this.handleReconnect();
    }
  }

  private async getUpdates() {
    try {
      logger.debug(`Fetching updates since ID: ${this.lastUpdateId + 1}`);

      const response = await axios.get(`${this.baseUrl}/getUpdates`, {
        params: {
          offset: this.lastUpdateId + 1,
          limit: 100, // Get more updates at once
          timeout: 10, // Shorter long-polling timeout
        },
      });

      const updates = response.data.result || [];

      if (updates.length > 0) {
        this.lastUpdateId = updates[updates.length - 1].update_id;
        logger.debug(`Updated lastUpdateId to: ${this.lastUpdateId}`);
      }

      return updates;
    } catch (error) {
      logger.error("Error getting updates:", error);
      if (axios.isAxiosError(error) && error.response?.status === 409) {
        await this.deleteWebhook();
        return [];
      }
      throw error;
    }
  }

  private async deleteWebhook() {
    try {
      await axios.post(`${this.baseUrl}/deleteWebhook`, {
        drop_pending_updates: true,
      });
      logger.info("Webhook deleted successfully");
    } catch (error) {
      logger.error("Error deleting webhook:", error);
      throw error;
    }
  }

  private async handleUpdate(update: TelegramUpdate) {
    try {
      // Check if service is initialized
      if (!this.isInitialized) {
        logger.warn("Telegram service not initialized, reinitializing...");
        await this.reinitialize();
        return;
      }

      const text = update.message?.text;
      if (!text) {
        return;
      }

      // Check if app is logged in before processing commands
      if (!_app.getState().loggedIn && text !== "/start" && text !== "/help") {
        await this.sendMessage("App is not logged in. Please log in first.");
        return;
      }

      logger.info(`Processing Telegram message: ${text}`);

      // Handle non-command messages
      if (!text.startsWith("/")) {
        await this.sendMessage(
          "Please use commands starting with /. Type /help for available commands."
        );
        return;
      }

      const [commandName, ...args] = text.slice(1).toLowerCase().split(" ");
      const handler = this.commandHandlers.get(commandName);

      if (!handler) {
        logger.info(`Unknown command received: ${commandName}`);
        await this.sendMessage(
          "Unknown command. Type /help for available commands."
        );
        return;
      }

      logger.info(`Executing command: ${commandName}`);
      await handler(args.join(" "));
    } catch (error) {
      logger.error("Error handling message:", error);
      await this.sendError("Failed to process your command. Please try again.");
    }
  }

  // Command Handlers
  private handleLogout = async () => {
    try {
      logger.info("Processing logout command");

      // Check if app is already logged out
      if (!_app.getState().loggedIn) {
        await this.sendMessage("App is already logged out");
        return;
      }

      // Send message before logout
      await this.sendMessage("Processing logout request...");

      // Perform logout
      _app.setState({ loggedIn: false, _db: true });

      // Notify through both channels
      await this.sendSuccess("App logged out successfully");
      notify.info({
        description: "Logged out via Telegram command",
        speak: true,
      });

      logger.info("Logout command completed successfully");
    } catch (error) {
      logger.error("Error in handleLogout:", error);
      await this.sendError(
        "Failed to logout. Please try again or check app status."
      );
      throw error;
    }
  };

  private handleStatus = async () => {
    try {
      logger.info("Processing status command");
      const { loggedIn, marketStatus } = _app.getState();

      const message = `🔵 App Status:
Login: ${loggedIn ? "✅" : "❌"}
Market: ${marketStatus?.activeStatus ? "🟢 Open" : "🔴 Closed"}
Time: ${new Date().toLocaleTimeString()}`;

      await this.sendMessage(message);
      logger.info("Status command completed successfully");
    } catch (error) {
      logger.error("Error in handleStatus:", error);
      await this.sendError("Failed to get status. Please try again.");
    }
  };

  private handlePositions = async () => {
    // Implement based on your app's state management
    // Example:
    // const positions = _shoonya.getState().positions;
    // await this.sendMessage(`Current Positions:\n${JSON.stringify(positions, null, 2)}`);
  };

  private handlePnL = async () => {
    try {
      logger.info("Processing PnL command");
      const pnl = _shoonyaSocket.getState()._shoonyaPL;

      const message = `💰 Current P&L: ${pnl ? pnl.toFixed(2) : "Not available"}
Time: ${new Date().toLocaleTimeString()}`;

      await this.sendMessage(message);
      logger.info("PnL command completed successfully");
    } catch (error) {
      logger.error("Error in handlePnL:", error);
      await this.sendError("Failed to get P&L. Please try again.");
    }
  };

  private handleHelp = async () => {
    const helpText = `
Available Commands:
/status - Check app status
/logoutapp - Logout from trading app
/positions - View current positions
/pnl - Check current P&L
/help - Show this help message`;

    await this.sendMessage(helpText);
  };

  private handleStart = async () => {
    const welcomeMessage = `
Welcome to Trade App Bot! 🤖
I can help you manage your trading app and send you notifications.

Type /help to see available commands.`;

    await this.sendMessage(welcomeMessage);
  };

  // Existing methods for sending messages
  async sendMessage(message: string, options: { silent?: boolean } = {}) {
    try {
      if (!this.botToken || !this.chatId) {
        throw new Error("Telegram credentials not configured");
      }

      const response = await axios.post(
        `${this.baseUrl}/sendMessage`,
        {
          chat_id: this.chatId,
          text: message,
          disable_notification: options.silent,
          parse_mode: "HTML",
        },
        {
          timeout: 10000, // 10 second timeout for sending messages
        }
      );

      if (response.status !== 200) {
        throw new Error(
          `Failed to send Telegram message: ${response.statusText}`
        );
      }

      return true;
    } catch (error) {
      logger.error("Error sending Telegram message:", error);
      // Retry once on failure
      try {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        const retryResponse = await axios.post(
          `${this.baseUrl}/sendMessage`,
          {
            chat_id: this.chatId,
            text: message,
            disable_notification: options.silent,
            parse_mode: "HTML",
          },
          {
            timeout: 10000,
          }
        );
        return retryResponse.status === 200;
      } catch (retryError) {
        logger.error("Error in retry attempt:", retryError);
        return false;
      }
    }
  }

  async sendAlert(message: string) {
    return this.sendMessage(`🚨 ALERT: ${message}`);
  }

  async sendInfo(message: string) {
    return this.sendMessage(`ℹ️ INFO: ${message}`);
  }

  async sendSuccess(message: string) {
    return this.sendMessage(`✅ SUCCESS: ${message}`);
  }

  async sendError(message: string) {
    return this.sendMessage(`❌ ERROR: ${message}`);
  }

  async sendTrade(tradeInfo: {
    type: "ENTRY" | "EXIT";
    symbol: string;
    quantity: number;
    price: number;
    pnl?: number;
  }) {
    const emoji = tradeInfo.type === "ENTRY" ? "📈" : "📉";
    const message = `${emoji} TRADE ${tradeInfo.type}:
Symbol: ${tradeInfo.symbol}
Quantity: ${tradeInfo.quantity}
Price: ${tradeInfo.price}${tradeInfo.pnl ? `\nP&L: ${tradeInfo.pnl}` : ""}`;

    return this.sendMessage(message);
  }

  public stopPolling() {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
    this.isPolling = false;
    this.isInitialized = false;
    logger.info("Telegram polling stopped");
  }

  public async reinitialize() {
    logger.info("Reinitializing Telegram service...");

    try {
      // Check bot status first
      const isBot = await this.checkBotStatus();
      if (!isBot) {
        logger.error("Bot check failed - invalid token or bot is down");
        return;
      }

      // Stop existing polling
      this.stopPolling();

      // Reset state
      this.lastUpdateId = 0;
      this.isPolling = false;
      this.reconnectAttempts = 0;
      this.isInitialized = false;

      // Delete webhook and start fresh
      await this.deleteWebhook();
      await this.startPolling();

      this.isInitialized = true;
      logger.info("Telegram service reinitialized successfully");
    } catch (error) {
      logger.error("Failed to reinitialize Telegram service:", error);
      this.isInitialized = false;
    }
  }

  // Add a new method to check bot status
  private async checkBotStatus() {
    try {
      const response = await axios.get(`${this.baseUrl}/getMe`);
      logger.info("Bot status check:", response.data);
      return response.data.ok;
    } catch (error) {
      logger.error("Bot status check failed:", error);
      return false;
    }
  }
}

// Create and export a singleton instance
const telegramService = new TelegramService();

// Add this to test the service is working
telegramService.checkBotStatus().then((isWorking) => {
  if (isWorking) {
    logger.info("Telegram bot is working correctly");
  } else {
    logger.error("Telegram bot is not working");
  }
});

// Handle graceful shutdown
process.on("SIGINT", async () => {
  await telegramService.sendInfo("Server shutting down...");
  telegramService.stopPolling();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  await telegramService.sendInfo("Server shutting down...");
  telegramService.stopPolling();
  process.exit(0);
});

// Handle uncaught errors
process.on("uncaughtException", async (error) => {
  logger.error("Uncaught exception:", error);
  await telegramService.sendError(`Server error: ${error.message}`);
});

process.on("unhandledRejection", async (error) => {
  logger.error("Unhandled rejection:", error);
  if (error instanceof Error) {
    await telegramService.sendError(`Server error: ${error.message}`);
  }
});

export default telegramService;
