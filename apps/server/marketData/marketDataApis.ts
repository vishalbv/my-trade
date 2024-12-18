import { sendResponse } from "@repo/utils/server/helpers";
import _fyers from "../states/fyers/index";

interface HistoryPayload {
  symbol: string;
  resolution: string;
  date_format?: number;
  range_from: string;
  range_to: string;
  cont_flag?: number;
  broker: "fyers" | "other_broker"; // Add other brokers as needed
}

export const declareMarketDataApis = () => ({
  "POST /api/history": async ({
    body,
    params,
  }: {
    body: HistoryPayload;
    params: { id: string };
  }) => {
    try {
      let historyData;

      switch (body.broker) {
        case "fyers": {
          historyData = await _fyers.getHistory({
            symbol: body.symbol,
            resolution: body.resolution,
            date_format: body.date_format,
            range_from: body.range_from,
            range_to: body.range_to,
            cont_flag: body.cont_flag,
          });
          break;
        }
        // Add other broker cases here
        default:
          throw new Error("Unsupported broker");
      }

      return {
        status: 200,
        message: "Historical data retrieved successfully",
        data: historyData,
      };
    } catch (error) {
      return {
        status: 500,
        message:
          error instanceof Error
            ? error.message
            : "Failed to fetch historical data",
      };
    }
  },
});
