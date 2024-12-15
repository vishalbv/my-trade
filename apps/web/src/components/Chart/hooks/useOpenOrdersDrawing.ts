import { useCallback, useState } from "react";
import { ChartTheme, Point } from "../types";
import { modifyOrder, cancelOrder } from "../../../store/actions/orderActions";

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

  toChartCoords: (x: number, y: number) => { x: number; y: number };
}

export const useOpenOrdersDrawing = ({
  dimensions,
  toChartCoords,
}: UseOpenOrdersDrawingProps) => {
  let initialOrders = [
    { orderId: "default", price: "100", side: 1 },
    { orderId: "default-1", price: "150", side: -1 },
  ];
  const [localOrders, setLocalOrders] = useState<Order[]>([
    { orderId: "default", price: "100", side: 1 },
    { orderId: "default-1", price: "150", side: -1 },
  ]);

  const [draggingOrder, setDraggingOrder] = useState<string | null>(null);

  const handleDragStart = useCallback((orderId: string, y: number) => {
    setDraggingOrder(orderId);
  }, []);

  const handleDrag = useCallback(
    (y: number) => {
      if (!draggingOrder) return;

      const chartCoords = toChartCoords(dimensions.padding.left, y);
      const newPrice = chartCoords.y.toFixed(2);

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
      const order = localOrders.find((o) => o.orderId === draggingOrder);
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
            try {
              await modifyOrder({
                orderid: order.orderId,
                price: order.price,
                tradingsymbol: order.tradingsymbol,
                broker: "shoonya",
              });
            } catch (error) {
              console.error("Failed to modify order:", error);
              setLocalOrders((prevOrders) =>
                prevOrders.map((o) =>
                  o.orderId === draggingOrder
                    ? { ...o, price: originalOrder.price }
                    : o
                )
              );
            }
          } else {
            setLocalOrders((prevOrders) =>
              prevOrders.map((o) =>
                o.orderId === draggingOrder
                  ? { ...o, price: originalOrder.price }
                  : o
              )
            );
          }
        }
      }
    }
    setDraggingOrder(null);
  }, [draggingOrder, localOrders]);

  const handleQuantityChange = useCallback(
    async (orderId: string, qty: string) => {
      const order = localOrders.find((o) => o.orderId === orderId);
      if (order) {
        try {
          await modifyOrder({
            orderid: order.orderId,
            qty,
            tradingsymbol: order.tradingsymbol,
            broker: "shoonya",
          });

          setLocalOrders((prevOrders) =>
            prevOrders.map((o) => (o.orderId === orderId ? { ...o, qty } : o))
          );
        } catch (error) {
          console.error("Failed to modify order quantity:", error);
        }
      }
    },
    [localOrders]
  );

  const handleCancelOrder = useCallback(
    async (orderId: string) => {
      const order = localOrders.find((o) => o.orderId === orderId);
      if (order) {
        try {
          await cancelOrder({
            orderid: order.orderId,
            tradingsymbol: order.tradingsymbol,
          });

          setLocalOrders((prevOrders) =>
            prevOrders.filter((o) => o.orderId !== orderId)
          );
        } catch (error) {
          console.error("Failed to cancel order:", error);
        }
      }
    },
    [localOrders]
  );

  return {
    orders: localOrders,
    handleDragStart,
    handleDrag,
    handleDragEnd,
    draggingOrder,
    handleQuantityChange,
    handleCancelOrder,
  };
};
