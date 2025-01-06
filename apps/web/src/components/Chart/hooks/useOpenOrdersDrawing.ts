import { useCallback, useEffect, useState } from "react";
import { ChartTheme, Point } from "../types";
import { modifyOrder, cancelOrder } from "../../../store/actions/orderActions";
import { RootState } from "../../../store/store";
import { useSelector } from "react-redux";
import { sendMessage } from "../../../services/webSocket";

interface Order {
  orderId: string;
  price: string;
  side: 1 | -1;
  qty?: string;
  tradingsymbol?: string;
}

interface UseOpenOrdersDrawingProps {
  dimensions: {
    width: number;
    height: number;
    padding: { top: number; right: number; bottom: number; left: number };
  };
  symbol: string;
  toChartCoords: (x: number, y: number) => { x: number; y: number };
}

export const useOpenOrdersDrawing = ({
  dimensions,
  toChartCoords,
  symbol,
}: UseOpenOrdersDrawingProps) => {
  let initialOrders = [
    { orderId: "default", price: "100", side: 1 },
    { orderId: "default-1", price: "150", side: -1 },
  ];

  // const orders = useSelector(
  //   (state: RootState) => state.states.shoonya?.orderBook || []
  // );

  const stateOrders = useSelector(
    (state: RootState) => state.states.app?.orders || []
  ).filter((o) => o.status === "OPEN" && o.symbol === symbol);
  console.log(stateOrders, symbol);
  const handleUpdateOrder = (order: Order) => {
    sendMessage("app", {
      orders: stateOrders.map((i) => (i.orderId === order.orderId ? order : i)),
    });
  };

  // const [localOrders, setLocalOrders] = useState<Order[]>([]);

  // useEffect(() => {
  //   if (JSON.stringify(stateOrders) !== JSON.stringify(localOrders)) {
  //     setLocalOrders(
  //       stateOrders.reduce((acc: Order[], o: any) => {
  //         if (o.status === "OPEN") {
  //           acc.push(o);
  //         }
  //         return acc;
  //       }, [])
  //     );
  //   }
  // }, [stateOrders]);

  // useEffect(() => {
  //   if (JSON.stringify(orders) !== JSON.stringify(localOrders)) {
  //     setLocalOrders(
  //       orders.reduce((acc: Order[], o: any) => {
  //         if (o.status === "OPEN") {
  //           acc.push({
  //             ...o,
  //             price: o.price?.toString() || "0",
  //             orderId: o.norenordno,
  //             side: o.trantype === "B" ? 1 : -1,
  //           });
  //         }
  //         return acc;
  //       }, [])
  //     );
  //   }
  // }, [orders]);

  const [draggingOrder, setDraggingOrder] = useState<string | null>(null);

  const handleDragStart = useCallback((orderId: string, y: number) => {
    setDraggingOrder(orderId);
  }, []);

  const handleDrag = useCallback(
    (y: number) => {
      if (!draggingOrder) return;

      const chartCoords = toChartCoords(dimensions.padding.left, y);
      const newPrice = chartCoords.y.toFixed(2);

      const updatedOrder = stateOrders.find((o) => o.orderId === draggingOrder);
      if (updatedOrder) {
        handleUpdateOrder({ ...updatedOrder, price: newPrice });
      }
    },
    [draggingOrder, toChartCoords, dimensions.padding.left, stateOrders]
  );

  const handleDragEnd = useCallback(async () => {
    if (draggingOrder) {
      const order = stateOrders.find((o) => o.orderId === draggingOrder);
      if (order) {
        const originalOrder = initialOrders?.find(
          (o) => o.orderId === draggingOrder
        );
        if (originalOrder) {
          const originalPrice = parseFloat(originalOrder.price);
          const newPrice = parseFloat(order.price);

          const priceChangePercent = Math.abs(
            ((newPrice - originalPrice) / originalPrice) * 100
          );

          if (priceChangePercent > 0.2) {
            handleUpdateOrder({ ...order, price: originalOrder.price });
          }
        }
      }
    }
    setDraggingOrder(null);
  }, [draggingOrder, stateOrders]);

  const handleQuantityChange = useCallback(
    async (orderId: string, qty: string) => {
      const order = stateOrders.find((o) => o.orderId === orderId);
      if (order) {
        try {
          // await modifyOrder({
          //   orderid: order.orderId,
          //   qty,
          //   tradingsymbol: order.tradingsymbol,
          //   broker: "shoonya",
          // });

          handleUpdateOrder({ ...order, qty });
        } catch (error) {
          console.error("Failed to modify order quantity:", error);
        }
      }
    },
    [stateOrders]
  );

  const handleCancelOrder = useCallback(
    async (orderId: string) => {
      const order = stateOrders.find((o) => o.orderId === orderId);
      if (order) {
        try {
          // await cancelOrder({
          //   orderid: order.orderId,
          //   tradingsymbol: order.tradingsymbol,
          // });

          handleUpdateOrder({
            ...order,
            status: "CANCELLED",
          });
        } catch (error) {
          console.error("Failed to cancel order:", error);
        }
      }
    },
    [stateOrders]
  );

  return {
    orders: stateOrders,
    handleDragStart,
    handleDrag,
    handleDragEnd,
    draggingOrder,
    handleQuantityChange,
    handleCancelOrder,
  };
};
