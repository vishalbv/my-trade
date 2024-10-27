import express from "express";
import _fyers from "../fyers/index";
import { sendResponse } from "@repo/utils/server/helpers";

export const declareAppApis = (app: express.Application) => {
  app.get("/", (req, res) => {
    sendResponse(res, {
      status: 200,
      message: "Hello from Bun Express in Turborepo",
    });
  });

  app.post("/api/preLogin", async function (req, res) {
    const { broker } = req.body;
    try {
      if (broker === "fyers") {
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
};
