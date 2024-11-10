import express from "express";
import { declareAppApis } from "./states/app/appApis";
import { declareTaskApis } from "./tasks/tasksApis";
import { declareNoteApis } from "./notes/notesApis";

export const declareApis = (app: express.Application) => {
  declareAppApis(app);
  declareTaskApis(app);
  declareNoteApis(app);
};
