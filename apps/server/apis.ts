import { declareAppApis } from "./states/app/appApis";
import { declareTaskApis } from "./tasks/tasksApis";
import { declareNoteApis } from "./notes/notesApis";
import { declareMarketDataApis } from "./marketData/marketDataApis";
import { declareOrderApis } from "./marketData/orderApis";
export const declareApis = () => {
  const handlers = {
    ...declareAppApis(),
    ...declareTaskApis(),
    ...declareNoteApis(),
    ...declareMarketDataApis(),
    ...declareOrderApis(),
  };
  return handlers;
};
