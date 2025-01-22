import { sendResponse } from "@repo/utils/server/helpers";
import _fyers from "../states/fyers/index";
import _shoonya from "../states/shoonya/index";
import _flattrade from "../states/flattrade/index";

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
      } else if (broker === "flattrade") {
        const { data } = await _flattrade.placeOrder(body);
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

  "POST /api/modifyOrder": async ({ body }: { body: RequestBody }) => {
    const { broker, norenordno, price } = body;

    try {
      if (broker === "fyers") {
        // Add Fyers implementation if needed
        return { status: 404, message: "Not implemented for Fyers" };
      } else if (broker === "shoonya") {
        const response = await _shoonya.modifyOrder(norenordno, price);
        return {
          status: 200,
          message: "Order modified successfully",
          data: response.data,
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
            : "An error occurred while modifying order",
      };
    }
  },

  "POST /api/cancelOrder": async ({ body }: { body: RequestBody }) => {
    const { broker, norenordno } = body;

    try {
      if (broker === "fyers") {
        // Add Fyers implementation if needed
        return { status: 404, message: "Not implemented for Fyers" };
      } else if (broker === "shoonya") {
        const response = await _shoonya.cancelOrder(norenordno);
        return {
          status: 200,
          message: "Order cancelled successfully",
          data: response.data,
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
            : "An error occurred while cancelling order",
      };
    }
  },

  "POST /api/closeAll": async ({ body }: { body: RequestBody }) => {
    const { broker, type } = body;

    try {
      if (broker === "fyers") {
        // Add Fyers implementation if needed
        return { status: 404, message: "Not implemented for Fyers" };
      } else if (broker === "shoonya") {
        const response = await _shoonya.closeAll({ type });
        return {
          status: 200,
          message: response.message || "positions closed successfully",
          data: response.data,
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
            : "An error occurred while cancelling order",
      };
    }
  },
});
