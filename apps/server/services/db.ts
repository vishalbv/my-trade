import { MongoClient, Db, Collection } from "mongodb";
import { DB_URL } from "@repo/utils/constants";
import logger from "./logger";

interface DBCollections {
  states: Collection;
  reports: Collection;
  tasks: Collection;
  notes: Collection;
}

class DatabaseService {
  private client: MongoClient;
  private db: Db | null = null;
  private collections: DBCollections | null = null;

  constructor() {
    this.client = new MongoClient(DB_URL);
  }

  async connect(): Promise<void> {
    try {
      await this.client.connect();
      this.db = this.client.db("trade-app");
      this.collections = {
        states: this.db.collection("states"),
        reports: this.db.collection("reports"),
        tasks: this.db.collection("tasks"),
        notes: this.db.collection("notes"),
      };
      logger.info("DB connected");
    } catch (error) {
      logger.error("Error connecting to database:", error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    try {
      await this.client.close();
      logger.info("DB disconnected");
    } catch (error) {
      logger.error("Error disconnecting from database:", error);
      throw error;
    }
  }

  private getCollection(name: keyof DBCollections): Collection {
    if (!this.collections) {
      throw new Error("Database not connected");
    }
    return this.collections[name];
  }

  async postToStatesDB(id: string, data: any): Promise<void> {
    try {
      logger.info("updating states db", data);
      await this.getCollection("states").updateOne(
        { id },
        { $set: data },
        { upsert: true }
      );
    } catch (error) {
      logger.error("Error updating states db:", error);
      throw error;
    }
  }

  async getAllStatesDB(): Promise<any[]> {
    try {
      return await this.getCollection("states").find().toArray();
    } catch (error) {
      logger.error("Error getting all states:", error);
      throw error;
    }
  }

  async getStatesDBByID(id: string): Promise<any | null> {
    try {
      return await this.getCollection("states").findOne({ id });
    } catch (error) {
      logger.error("Error getting state by ID:", error);
      throw error;
    }
  }

  async postToReportsDB(id: string, data: any): Promise<void> {
    try {
      logger.info("updating reports db", data);
      await this.getCollection("reports").updateOne(
        { id },
        { $set: data },
        { upsert: true }
      );
    } catch (error) {
      logger.error("Error updating reports db:", error);
      throw error;
    }
  }

  async postToTasksDB(id: string, data: any, isDelete: boolean): Promise<void> {
    try {
      logger.info("updating tasks db", data, id);
      if (isDelete) {
        await this.getCollection("tasks").deleteOne({ id });
      } else {
        await this.getCollection("tasks").updateOne(
          { id },
          { $set: data },
          { upsert: true }
        );
      }
    } catch (error) {
      logger.error("Error updating tasks db:", error);
      throw error;
    }
  }

  async getReportsFromDB(): Promise<any[]> {
    try {
      return await this.getCollection("reports").find().toArray();
    } catch (error) {
      logger.error("Error getting reports:", error);
      throw error;
    }
  }

  async getTasksFromDB(): Promise<any[]> {
    try {
      return await this.getCollection("tasks").find().toArray();
    } catch (error) {
      logger.error("Error getting tasks:", error);
      throw error;
    }
  }

  async getNotesFromDB(): Promise<any[]> {
    try {
      return await this.getCollection("notes").find().toArray();
    } catch (error) {
      logger.error("Error getting notes:", error);
      throw error;
    }
  }
}

const dbService = new DatabaseService();
export const startDbService = async () => {
  logger.info("Starting DB service...");
  try {
    await dbService.connect();
    // Handle graceful shutdown
    process.on("SIGINT", async () => {
      try {
        logger.info("Shutting down server...");
        await dbService.disconnect();
        logger.info("Server shut down successfully");
        process.exit(0);
      } catch (error) {
        logger.error("Error during shutdown:", error);
        process.exit(1);
      }
    });
  } catch (error) {
    logger.error("Failed to start the application:", error);
    process.exit(1);
  }
};

export default dbService;
