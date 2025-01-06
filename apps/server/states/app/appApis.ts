import { sendResponse } from "@repo/utils/server/helpers";
import _app from "./index";
import initializeApp from "./app-initialize";
import moment from "moment";
import { logoutAll } from "../../utils/helpers";
import _fyers from "../fyers/index";
import _shoonya from "../shoonya/index";
import statesDbService from "../../services/statesDb";

import dbService from "../../services/db";
import { generateReport } from "../../reports";

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
        const fyersState = await statesDbService.getStateById("fyers");
        if (fyersState?.refresh_token) {
          _fyers.setState(fyersState);
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

  "POST /api/generateReport": async ({ body }: { body: RequestBody }) => {
    try {
      await generateReport();
      return { status: 200, message: "Report generated" };
    } catch (error) {
      return {
        status: 500,
        message:
          error instanceof Error ? error.message : "Error in generating report",
      };
    }
  },

  "POST /api/getReports": async ({ body }: { body: RequestBody }) => {
    try {
      const reports = await dbService.getDocuments("reports");
      return { status: 200, message: "Report fetched", data: reports };
    } catch (error) {
      return {
        status: 500,
        message:
          error instanceof Error ? error.message : "Error in fetching report",
      };
    }
  },

  "POST /api/restartServer": async ({ body }: { body: RequestBody }) => {
    try {
      const data = initializeApp();
      return { status: 200, message: "Report fetched", data };
    } catch (error) {
      return {
        status: 500,
        message:
          error instanceof Error ? error.message : "Error in fetching report",
      };
    }
  },

  "POST /api/loginDetails": async ({ body }: { body: RequestBody }) => {
    const { broker } = body;
    try {
      if (broker === "fyers") {
        // const result = await _fyers.loginDetails();
        // return { status: 200, message: "Login details fetched", data: result };
      } else if (broker === "shoonya") {
        const { data } = await _shoonya.loginDetails();
        return { status: 200, message: "Login details fetched", data };
      }
    } catch (error) {
      return {
        status: 500,
        message:
          error instanceof Error ? error.message : "Error in fetching report",
      };
    }
  },
});
