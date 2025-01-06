import { declareAppApis } from "./states/app/appApis";
import { declareTaskApis } from "./tasks/tasksApis";
import { declareNoteApis } from "./notes/notesApis";
import { declareMarketDataApis } from "./marketData/marketDataApis";
import { declareOrderApis } from "./marketData/orderApis";
import { declareHistoryDBApis } from "./historyDB/historyDBApis";

export const declareApis = () => {
  const handlers = {
    ...declareAppApis(),
    ...declareTaskApis(),
    ...declareNoteApis(),
    ...declareMarketDataApis(),
    ...declareOrderApis(),
    ...declareHistoryDBApis(),
  };
  return handlers;
};
