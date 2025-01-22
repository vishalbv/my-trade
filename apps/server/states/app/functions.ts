import { _fyersSocket } from "../fyers/socket";
import _app from "../app/index";

export const subscrbeSymbolsForOrders = (orders: any) => {
  if (!orders) return;
  const symbols = orders.map((order: any) => order.symbol);
  _fyersSocket.subscribeTicks(symbols);
};
