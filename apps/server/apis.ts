import { declareAppApis } from "./states/app/appApis";
import { declareTaskApis } from "./tasks/tasksApis";
import { declareNoteApis } from "./notes/notesApis";
import { declareMarketDataApis } from "./marketData/marketDataApis";

export const declareApis = () => {
  const handlers = {
    ...declareAppApis(),
    ...declareTaskApis(),
    ...declareNoteApis(),
    ...declareMarketDataApis(),
  };
  return handlers;
};
