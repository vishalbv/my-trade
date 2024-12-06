import { sendMessage } from "../../services/webSocket";

export const updateFyersToShoonyaMapping = (payload: any) =>
  sendMessage("symbols", {
    _key: "fyersToShoonyaMapping",
    _db: true,
    ...payload,
  });
