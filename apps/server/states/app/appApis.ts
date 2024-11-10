import express from "express";
import { sendResponse } from "@repo/utils/server/helpers";
import _app from "./index";
import initializeApp from "./app-initialize";
import moment from "moment";
import dbService from "../../services/db";
import { logoutAll } from "../../utils/helpers";
import _fyers from "../fyers/index";
import _shoonya from "../shoonya/index";
import statesDbService from "../../services/statesDb";

export const declareAppApis = (app: express.Application) => {
  app.post("/api/preLogin", async function (req, res) {
    console.log("preLogin", req.body);
    const { broker } = req.body;
    try {
      if (broker === "fyers") {
        if (_fyers.getState().refresh_token) {
          sendResponse(res, {
            status: 200,
            message: "Already logging in",
            data: { autoLogin: true },
          });
          return;
        }
        const result = await _fyers.preLogin();
        sendResponse(res, {
          status: 200,
          message: "Pre-login successful",
          data: result,
        });
      } else {
        sendResponse(res, { status: 404, message: "Broker not found" });
      }
    } catch (error) {
      sendResponse(res, {
        status: 500,
        message:
          error instanceof Error
            ? error.message
            : "An error occurred during pre-login",
      });
    }
  });

  app.post("/api/login", async function (req, res) {
    const { broker } = req.body;

    try {
      if (broker === "fyers") {
        console.log("oooooooo");

        const result = await _fyers.login(req.body);
        sendResponse(res, {
          status: 200,
          message: "Login successful",
          data: result,
        });
      } else if (broker === "shoonya") {
        const result = await _shoonya.login();
        sendResponse(res, {
          status: 200,
          message: "Login successful",
          data: result,
        });
      } else {
        sendResponse(res, { status: 404, message: "Broker not found" });
      }
      if (_app.getState().loggedIn) {
        _app.setState({ loggingIn: false });
        initializeApp();
        statesDbService.upsertState("app", {
          lastLoginDate: moment().valueOf(),
        });
      }
    } catch (error) {
      sendResponse(res, {
        status: 500,
        message:
          error instanceof Error
            ? error.message
            : "An error occurred during login",
      });
    }
  });

  app.post("/api/logout", async function (req, res) {
    const { broker, ...body } = req.body;

    if (broker == "fyers") {
      const result = await _fyers.logout();
      sendResponse(res, { status: 200, message: "Logout successful" });
    } else if (broker == "shoonya") {
      const result = await _shoonya.logout();
      sendResponse(res, { status: 200, message: "Logout successful" });
    } else {
      logoutAll();
      sendResponse(res, { status: 200, message: "Logout successful" });
    }
  });

  // app.get("/", (req, res) => {
  //   sendResponse(res, {
  //     status: 200,
  //     message: "Hello from Bun Express in Turborepo",
  //   });
  // });
};
