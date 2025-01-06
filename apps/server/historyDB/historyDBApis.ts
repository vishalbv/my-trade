import dbService from "../services/db";
import moment from "moment";
import { DDMMYYYY } from "@repo/utils/constants";

export const declareHistoryDBApis = () => ({
  "POST /api/storeHistory": async ({ body }: { body: any }) => {
    try {
      const data: any = {
        data: body,
      };
      await dbService.upsertDocument(
        "history",
        moment().format(DDMMYYYY),
        data
      );
      return {
        status: 200,
        message: "History created successfully",
        data: data,
      };
    } catch (error) {
      return {
        status: 500,
        message:
          error instanceof Error ? error.message : "Failed to create history",
      };
    }
  },

  "GET /api/getStoredHistory": async ({ body }: { body: { id: string } }) => {
    try {
      const history = await dbService.getCollection("history").findOne({
        id: body.id,
      });
      return {
        status: 200,
        message: "History retrieved successfully",
        data: history,
      };
    } catch (error) {
      return {
        status: 500,
        message:
          error instanceof Error ? error.message : "Failed to fetch history",
      };
    }
  },
});
