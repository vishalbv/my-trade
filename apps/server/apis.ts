import { declareAppApis } from "./states/app/appApis";
import { declareTaskApis } from "./tasks/tasksApis";
import { declareNoteApis } from "./notes/notesApis";

export const declareApis = () => {
  const handlers = {
    ...declareAppApis(),
    ...declareTaskApis(),
    ...declareNoteApis(),
  };
  return handlers;
};
