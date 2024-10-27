import express from "express";
import { declareAppApis } from "./states/app/appApis";

export const declareApis = (app: express.Application) => {
  declareAppApis(app);
};
