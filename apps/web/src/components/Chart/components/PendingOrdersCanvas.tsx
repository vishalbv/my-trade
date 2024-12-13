import { useEffect, useRef, useCallback, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "../../../store/store";
import { Order } from "../../../types/order";
import { modifyOrder, cancelOrder } from "../../../store/actions/orderActions";

interface PendingOrdersCanvasProps {
  dimensions: {
    width: number;
    height: number;
    padding: { top: number; right: number; bottom: number; left: number };
  };
  mousePosition: { x: number; y: number; price: number; visible: boolean };
  getY: (price: number, chartHeight: number) => number;
  theme: any;
  isRSIEnabled: boolean;
  rsiHeight: number;
}

export const PendingOrdersCanvas: React.FC<PendingOrdersCanvasProps> = ({
  dimensions,
  mousePosition,
  getY,
  theme,
  isRSIEnabled,
  rsiHeight,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const draggedOrderRef = useRef<{
    order: Order;
    offsetY: number;
  } | null>(null);

  const dispatch = useDispatch();

  const pendingOrders = useSelector(
    (state: RootState) =>
      state.states.shoonya?.orderBook
        ?.filter((order) => order.status === "REJECTED")
        .slice(0, 1)
        .map((i) => ({ ...i, prc: 100 })) || []
  );

  // Add state for hover
  const [isHovered, setIsHovered] = useState(false);

  const drawOrder = useCallback(
    (
      ctx: CanvasRenderingContext2D,
      order: Order,
      y: number,
      isDragging = false
    ) => {
      const chartHeight =
        dimensions.height - (isRSIEnabled ? rsiHeight + 34 : 30);
      const orderWidth = 120;
      const orderHeight = 24;
      const x = dimensions.width - dimensions.padding.right - orderWidth - 5;

      // Draw dashed line to y-axis
      ctx.beginPath();
      ctx.setLineDash([4, 4]);
      ctx.strokeStyle = theme.text + "66"; // Semi-transparent
      ctx.moveTo(dimensions.padding.left, y);
      ctx.lineTo(x - 5, y);
      ctx.stroke();
      ctx.setLineDash([]); // Reset dash pattern

      // Draw price label on y-axis
      const priceText = order.prc.toFixed(2);
      ctx.fillStyle = theme.background + "ee";
      const priceLabelWidth = ctx.measureText(priceText).width + 10;
      const priceLabelHeight = 20;

      // Draw price label background
      ctx.fillRect(
        dimensions.padding.left - priceLabelWidth,
        y - priceLabelHeight / 2,
        priceLabelWidth,
        priceLabelHeight
      );

      // Draw price text
      ctx.fillStyle = theme.text;
      ctx.textAlign = "right";
      ctx.textBaseline = "middle";
      ctx.fillText(priceText, dimensions.padding.left - 5, y);

      // Draw order background
      ctx.fillStyle = isDragging
        ? theme.background + "aa"
        : theme.background + "88";
      ctx.strokeStyle =
        order.buyorsell === "B" ? theme.upColor : theme.downColor;
      ctx.lineWidth = 1;

      // Draw rounded rectangle
      ctx.beginPath();
      ctx.roundRect(x, y - orderHeight / 2, orderWidth, orderHeight, 4);
      ctx.fill();
      ctx.stroke();

      // Draw order details
      ctx.fillStyle = theme.text;
      ctx.font = `10px ${theme.fontFamily}`;
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";

      // Draw side indicator (B/S)
      const sideText = order.buyorsell === "B" ? "BUY" : "SELL";
      ctx.fillStyle = order.buyorsell === "B" ? theme.upColor : theme.downColor;
      ctx.fillText(sideText, x + 6, y);

      // Draw quantity in center
      ctx.fillStyle = theme.text;
      ctx.textAlign = "center";
      ctx.fillText(order.qty.toString(), x + orderWidth / 2, y);

      // Draw price
      ctx.textAlign = "right";
      ctx.fillText(order.prc.toFixed(2), x + orderWidth - 6, y);

      // Draw cancel button if not dragging
      if (!isDragging) {
        const cancelSize = 16;
        const cancelX = x + orderWidth + 5;
        const cancelY = y - cancelSize / 2;

        ctx.beginPath();
        ctx.arc(cancelX + cancelSize / 2, y, cancelSize / 2, 0, Math.PI * 2);
        ctx.fillStyle = theme.background + "88";
        ctx.fill();
        ctx.strokeStyle = theme.text;
        ctx.stroke();

        // Draw X
        ctx.beginPath();
        ctx.moveTo(cancelX + 5, y - 5);
        ctx.lineTo(cancelX + cancelSize - 5, y + 5);
        ctx.moveTo(cancelX + cancelSize - 5, y - 5);
        ctx.lineTo(cancelX + 5, y + 5);
        ctx.strokeStyle = theme.text;
        ctx.stroke();
      }
    },
    [dimensions, theme, isRSIEnabled, rsiHeight]
  );

  const isPointInOrder = useCallback(
    (x: number, y: number, order: Order): boolean => {
      const chartHeight =
        dimensions.height - (isRSIEnabled ? rsiHeight + 34 : 30);
      const orderY = getY(order.prc, chartHeight);
      const orderWidth = 120;
      const orderHeight = 24;
      const orderX =
        dimensions.width - dimensions.padding.right - orderWidth - 5;

      return (
        x >= orderX &&
        x <= orderX + orderWidth &&
        y >= orderY - orderHeight / 2 &&
        y <= orderY + orderHeight / 2
      );
    },
    [dimensions, getY, isRSIEnabled, rsiHeight]
  );

  const isPointInCancelButton = useCallback(
    (x: number, y: number, order: Order): boolean => {
      const chartHeight =
        dimensions.height - (isRSIEnabled ? rsiHeight + 34 : 30);
      const orderY = getY(order.prc, chartHeight);
      const orderWidth = 120;
      const cancelSize = 16;
      const cancelX =
        dimensions.width -
        dimensions.padding.right -
        orderWidth -
        5 +
        orderWidth +
        5;

      const dx = x - (cancelX + cancelSize / 2);
      const dy = y - orderY;
      return Math.sqrt(dx * dx + dy * dy) <= cancelSize / 2;
    },
    [dimensions, getY, isRSIEnabled, rsiHeight]
  );

  useEffect(() => {
    if (!canvasRef.current) return;

    const ctx = canvasRef.current.getContext("2d");
    if (!ctx) return;

    // Set canvas size with device pixel ratio
    const dpr = window.devicePixelRatio || 1;
    canvasRef.current.width = dimensions.width * dpr;
    canvasRef.current.height = dimensions.height * dpr;
    ctx.scale(dpr, dpr);

    // Clear canvas
    ctx.clearRect(0, 0, dimensions.width, dimensions.height);

    // Draw all orders
    pendingOrders.forEach((order) => {
      const chartHeight =
        dimensions.height - (isRSIEnabled ? rsiHeight + 34 : 30);
      const y = getY(order.prc, chartHeight);

      // Skip drawing if this is the order being dragged
      if (draggedOrderRef.current?.order.norenordno === order.norenordno) {
        return;
      }

      drawOrder(ctx, order, y);
    });

    // Draw dragged order last (on top)
    if (draggedOrderRef.current && mousePosition.visible) {
      drawOrder(ctx, draggedOrderRef.current.order, mousePosition.y, true);
    }
  }, [
    dimensions,
    pendingOrders,
    mousePosition,
    drawOrder,
    getY,
    isRSIEnabled,
    rsiHeight,
  ]);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (!canvasRef.current) return;

      const rect = canvasRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      // Check if clicked on cancel button first
      const clickedOrder = pendingOrders.find((order) =>
        isPointInCancelButton(x, y, order)
      );
      if (clickedOrder) {
        cancelOrder({
          broker: "shoonya",
          norenordno: clickedOrder.norenordno,
        });
      }

      // Check if clicked on order
      const orderToMove = pendingOrders.find((order) =>
        isPointInOrder(x, y, order)
      );
      if (orderToMove) {
        draggedOrderRef.current = {
          order: orderToMove,
          offsetY: y - getY(orderToMove.price, dimensions.height),
        };
      }
    },
    [
      dispatch,
      pendingOrders,
      isPointInOrder,
      isPointInCancelButton,
      getY,
      dimensions,
    ]
  );

  const handleMouseUp = useCallback(() => {
    if (draggedOrderRef.current && mousePosition.visible) {
      modifyOrder({
        broker: "shoonya",
        norenordno: draggedOrderRef.current.order.norenordno,
        price: mousePosition.price,
      });
    }
    draggedOrderRef.current = null;
  }, [dispatch, mousePosition]);

  // Add hover detection
  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (!canvasRef.current) return;

      const rect = canvasRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      // Check if mouse is over any order or cancel button
      const isOverOrder = pendingOrders.some(
        (order) =>
          isPointInOrder(x, y, order) || isPointInCancelButton(x, y, order)
      );

      setIsHovered(isOverOrder);

      if (draggedOrderRef.current) {
        // Update canvas for dragging
        const ctx = canvasRef.current.getContext("2d");
        if (ctx) {
          ctx.clearRect(0, 0, dimensions.width, dimensions.height);

          // Draw other orders
          pendingOrders.forEach((order) => {
            if (
              order.norenordno !== draggedOrderRef.current?.order.norenordno
            ) {
              const chartHeight =
                dimensions.height - (isRSIEnabled ? rsiHeight + 34 : 30);
              const orderY = getY(order.prc, chartHeight);
              drawOrder(ctx, order, orderY);
            }
          });

          // Draw dragged order
          drawOrder(ctx, draggedOrderRef.current.order, y, true);
        }
      }
    },
    [
      dimensions,
      pendingOrders,
      drawOrder,
      getY,
      isRSIEnabled,
      rsiHeight,
      isPointInOrder,
      isPointInCancelButton,
    ]
  );

  return (
    <canvas
      ref={canvasRef}
      id={"PendingOrdersCanvas"}
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "auto",
        // Adjust z-index based on interaction state
        zIndex: draggedOrderRef.current ? 200 : isHovered ? 100 : 3,
        cursor: draggedOrderRef.current
          ? "grabbing"
          : isHovered
            ? "pointer"
            : "default",
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={() => {
        handleMouseUp();
        setIsHovered(false);
      }}
    />
  );
};
