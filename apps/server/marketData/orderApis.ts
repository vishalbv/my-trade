import { sendResponse } from "@repo/utils/server/helpers";
import _fyers from "../states/fyers/index";
import _shoonya from "../states/shoonya/index";

interface RequestBody {
  broker: string;
  [key: string]: any;
}

export const declareOrderApis = () => ({
  "POST /api/placeOrder": async ({ body }: { body: RequestBody }) => {
    const { broker } = body;

    try {
      if (broker === "fyers") {
        // const result = await _fyers.placeOrder(body);
        // return {
        //   status: 200,
        //   message: "Order placed successfully",
        //   data: result,
        // };
      } else if (broker === "shoonya") {
        const { data } = await _shoonya.placeOrder(body);
        return {
          status: 200,
          message: "Order placed successfully",
          data,
        };
      } else {
        return { status: 404, message: "Broker not found" };
      }
    } catch (error) {
      return {
        status: 500,
        message:
          error instanceof Error
            ? error.message
            : "An error occurred while placing order",
      };
    }
  },
});
