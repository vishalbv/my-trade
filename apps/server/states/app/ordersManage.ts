import { INDEX_DETAILS } from "@repo/utils/constants";
import _shoonya from "../shoonya/index";
import _app from "./index";
import { getIndexNameFromOptionSymbol } from "@repo/utils/helpers";

export const checkOpenOrders = (tickData: { symbol: string; ltp: number }) => {
  console.log(tickData, "tickData");
  const openOrders = _app
    .getState()
    .orders.filter((order: any) => order.status === "OPEN");
  openOrders.forEach((order: any) => {
    if (order.symbol === tickData.symbol) {
      if (
        order?.tickDataAtCreation?.ltp >= order.price &&
        tickData.ltp <= order.price
      ) {
        handlePlaceOrder(order);
      } else if (
        order?.tickDataAtCreation?.ltp <= order.price &&
        tickData.ltp >= order.price
      ) {
        handlePlaceOrder(order);
      }
    }
  });
};

const handlePlaceOrder = async (order: any) => {
  await _shoonya.placeOrder({
    qty: order.qty,
    side: order.side,
    type: 2,
    fyersSymbol: order.symbolInfo,
    price: 0,
    order_type: "MKT",
    frzqty:
      INDEX_DETAILS[
        getIndexNameFromOptionSymbol({
          symbol: order.symbol,
        })
      ].freezeQty,
  });

  handleUpdateOrder(order);
};

const handleUpdateOrder = (order: any) => {
  _app.setState({
    _db: true,
    orders: _app
      .getState()
      .orders.map((o: any) =>
        o.orderId === order.orderId ? { ...order, status: "CLOSED" } : o
      ),
  });
};
