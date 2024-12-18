import { sendResponse } from "@repo/utils/server/helpers";
import _app from "./index";
import initializeApp from "./app-initialize";
import moment from "moment";
import { logoutAll } from "../../utils/helpers";
import _fyers from "../fyers/index";
import _shoonya from "../shoonya/index";
import statesDbService from "../../services/statesDb";

interface RequestBody {
  broker: string;
  [key: string]: any;
}

export const declareAppApis = () => ({
  "POST /api/preLogin": async ({ body }: { body: RequestBody }) => {
    console.log("preLogin", body);
    const { broker } = body;
    try {
      if (broker === "fyers") {
        if (_fyers.getState().refresh_token) {
          return {
            status: 200,
            message: "Already logging in",
            data: { autoLogin: true },
          };
        }
        const result = await _fyers.preLogin();
        return {
          status: 200,
          message: "Pre-login successful",
          data: result,
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
            : "An error occurred during pre-login",
      };
    }
  },

  "POST /api/login": async ({ body }: { body: RequestBody }) => {
    const { broker } = body;

    try {
      if (broker === "fyers") {
        console.log("oooooooo");
        const result = await _fyers.login(body);
        if (_app.getState().loggedIn) {
          _app.setState({ loggingIn: false });
          initializeApp();
          statesDbService.upsertState("app", {
            lastLoginDate: moment().valueOf(),
          });
        }
        return {
          status: 200,
          message: "Login successful",
          data: result,
        };
      } else if (broker === "shoonya") {
        const result = await _shoonya.login();
        if (_app.getState().loggedIn) {
          _app.setState({ loggingIn: false });
          initializeApp();
          statesDbService.upsertState("app", {
            lastLoginDate: moment().valueOf(),
          });
        }
        return {
          status: 200,
          message: "Login successful",
          data: result,
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
            : "An error occurred during login",
      };
    }
  },

  "POST /api/logout": async ({ body }: { body: RequestBody }) => {
    const { broker } = body;

    try {
      if (broker === "fyers") {
        await _fyers.logout();
        return { status: 200, message: "Logout successful" };
      } else if (broker === "shoonya") {
        await _shoonya.logout();
        return { status: 200, message: "Logout successful" };
      } else {
        logoutAll();
        return { status: 200, message: "Logout successful" };
      }
    } catch (error) {
      return {
        status: 500,
        message:
          error instanceof Error
            ? error.message
            : "An error occurred during logout",
      };
    }
  },
});
