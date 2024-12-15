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

  getCollection(name: keyof DBCollections): Collection {
    if (!this.collections) {
      throw new Error("Database not connected");
    }
    return this.collections[name];
  }

  async createDocument(collectionName: keyof DBCollections, document: any) {
    logger.info(`Creating document in ${collectionName}`, document);
    return this.getCollection(collectionName).insertOne(document);
  }

  async getDocuments(collectionName: keyof DBCollections) {
    return this.getCollection(collectionName)
      .find()
      .sort({ updatedAt: -1, createdAt: -1 })
      .toArray();
  }

  async upsertDocument(
    collectionName: keyof DBCollections,
    id: string,
    data: any
  ) {
    logger.info("Upserting state:", { id, data });
    try {
      return await this.getCollection(collectionName).updateOne(
        { id },
        {
          $set: {
            ...data,
            updatedAt: Date.now(),
          },
        },
        { upsert: true }
      );
    } catch (error) {
      logger.error("Error upserting state:", error);
      throw error;
    }
  }

  async updateDocument(
    collectionName: keyof DBCollections,
    id: string,
    updates: any
  ) {
    const { _id, ...updatesToApply } = updates;
    return this.getCollection(collectionName).updateOne(
      { id },
      { $set: updatesToApply }
    );
  }

  async deleteDocument(collectionName: keyof DBCollections, id: string) {
    logger.info(`Deleting document from ${collectionName}`, id);
    return this.getCollection(collectionName).deleteOne({ id });
  }
}

const dbService = new DatabaseService();

export const startDbService = async () => {
  logger.info("Starting DB service...");
  try {
    // Create a promise that rejects after 30 seconds
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(
        () => reject(new Error("Database connection timeout after 30s")),
        30000
      );
    });

    // Race between connection and timeout
    await Promise.race([dbService.connect(), timeoutPromise]);

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
