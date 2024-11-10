import express from "express";
import { declareAppApis } from "./states/app/appApis";
import { declareTaskApis } from "./tasks/tasksApis";

export const declareApis = (app: express.Application) => {
  declareAppApis(app);
  declareTaskApis(app);
};
