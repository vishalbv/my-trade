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
  const tickData = useSelector((state: any) => state.ticks?.fyers_web[symbol]);
  const stateOrders = useSelector(
    (state: RootState) => state.states.app?.orders || []
  ).filter(
    (o: { status: string; symbol: string }) =>
      o.status === "OPEN" && o.symbol === symbol
  );

  const [localOrders, setLocalOrders] = useState<Order[]>([]);
  const [draggingOrder, setDraggingOrder] = useState<string | null>(null);

  // Update local orders when stateOrders changes
  useEffect(() => {
    if (JSON.stringify(stateOrders) !== JSON.stringify(localOrders)) {
      setLocalOrders(stateOrders);
    }
  }, [JSON.stringify(stateOrders)]);

  const handleUpdateOrder = (order: Order) => {
    // Only update server state when not dragging
    if (!draggingOrder) {
      sendMessage("app", {
        _db: true,
        orders: stateOrders.map((i: { orderId: string }) =>
          i.orderId === order.orderId
            ? { ...order, tickDataAtCreation: tickData }
            : i
        ),
      });
    }
  };

  const handleDrag = useCallback(
    (y: number) => {
      if (!draggingOrder) return;

      const chartCoords = toChartCoords(dimensions.padding.left, y);
      const newPrice = chartCoords.y.toFixed(2);
      console.log("newPrice", newPrice);
      // Update only local state while dragging
      setLocalOrders((prevOrders) =>
        prevOrders.map((order) =>
          order.orderId === draggingOrder
            ? { ...order, price: newPrice }
            : order
        )
      );
    },
    [draggingOrder, toChartCoords, dimensions.padding.left]
  );

  const handleDragEnd = useCallback(async () => {
    if (draggingOrder) {
      const order = localOrders.find(
        (o: { orderId: string }) => o.orderId === draggingOrder
      );
      if (order) {
        const originalOrder = stateOrders.find(
          (o: { orderId: string }) => o.orderId === draggingOrder
        );
        if (originalOrder) {
          const originalPrice = parseFloat(originalOrder.price);
          const newPrice = parseFloat(order.price);

          const priceChangePercent = Math.abs(
            ((newPrice - originalPrice) / originalPrice) * 100
          );

          // Now update the server state after drag ends
          if (priceChangePercent < 0.2) {
            sendMessage("app", {
              _db: true,
              orders: stateOrders.map((i: { orderId: string }) =>
                i.orderId === order.orderId
                  ? { ...originalOrder, tickDataAtCreation: tickData }
                  : i
              ),
            });
          } else {
            sendMessage("app", {
              _db: true,
              orders: stateOrders.map((i: { orderId: string }) =>
                i.orderId === order.orderId
                  ? { ...order, tickDataAtCreation: tickData }
                  : i
              ),
            });
          }
        }
      }
    }
    setDraggingOrder(null);
  }, [draggingOrder, localOrders, stateOrders, tickData]);

  const handleDragStart = useCallback((orderId: string, y: number) => {
    setDraggingOrder(orderId);
  }, []);

  const handleQuantityChange = useCallback(
    async (orderId: string, qty: string) => {
      const order = stateOrders.find((o: any) => o.orderId === orderId);
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
      const order = stateOrders.find((o: any) => o.orderId === orderId);
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
    orders: localOrders, // Return local orders instead of stateOrders
    handleDragStart,
    handleDrag,
    handleDragEnd,
    draggingOrder,
    handleQuantityChange,
    handleCancelOrder,
  };
};
