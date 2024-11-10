import dbService from "./db";
import logger from "./logger";

interface State {
  id: string;
  value: any;
  createdAt: number;
  updatedAt: number;
}

class StatesDbService {
  async getStates() {
    logger.info("Fetching all states");
    return dbService.getDocuments("states");
  }

  async getStateById(id: string) {
    logger.info("Fetching state by id:", id);
    try {
      return await dbService.getCollection("states").findOne({ id });
    } catch (error) {
      logger.error("Error fetching state by id:", error);
      throw error;
    }
  }

  async upsertState(id: string, data: any) {
    logger.info("Upserting state:", { id, data });
    try {
      return await dbService.getCollection("states").updateOne(
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

  async deleteState(id: string) {
    logger.info("Deleting state:", id);
    return dbService.deleteDocument("states", id);
  }
}

const statesDbService = new StatesDbService();
export default statesDbService;
