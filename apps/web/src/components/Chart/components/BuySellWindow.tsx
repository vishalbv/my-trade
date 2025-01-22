"use client";

import { useState, useEffect, memo, useRef } from "react";
import { Button } from "@repo/ui/button";
import { Input } from "@repo/ui/input";
import { cn } from "@repo/utils/ui/helpers";
import { round } from "../utils/drawingCoordinateUtils";
import { placeOrder } from "../../../store/actions/orderActions";
import { INDEX_DETAILS } from "@repo/utils/constants";
import { getIndexNameFromOptionSymbol } from "@repo/utils/helpers";
import { useSelector } from "react-redux";
import { RootState } from "../../../store/store";
import { sendMessage } from "../../../services/webSocket";

interface BuySellWindowProps {
  className?: string;
  chartState: { symbol: string; timeframe: string; symbolInfo: any };
  currentPrice?: number;
  rsiHeight: number;
  chartKey: string;
}

interface OrderState {
  side: 1 | -1;
  priceType: "LIMIT" | "MARKET";
  price: string;
  symbolInfo: any;
}

export const BuySellWindow = ({
  className,
  chartState,
  currentPrice,
  rsiHeight,
  chartKey,
}: BuySellWindowProps) => {
  const { selectedChartKey, chartFullScreenId } = useSelector(
    (state: RootState) => state.globalChart
  );
  const tickData = useSelector(
    (state: any) => state.ticks?.fyers_web[chartState?.symbolInfo?.symbol]
  );

  const orders = useSelector(
    (state: RootState) => state.states.app?.orders || []
  );

  const [isVisible, setIsVisible] = useState(false);

  const { lotSize } = chartState?.symbolInfo || {};

  const defaultOrderState: OrderState = {
    side: 1,
    priceType: "MARKET",
    price: "",
    symbol: chartState.symbol,
    symbolInfo: chartState.symbolInfo,
  };

  const [orderState, setOrderState] = useState<OrderState>(defaultOrderState);
  const qtyInputRef = useRef<HTMLInputElement>(null);

  const closeWindow = () => {
    setIsVisible(false);
    setOrderState(defaultOrderState);
  };

  useEffect(() => {
    if (lotSize) {
      setOrderState((prev) => ({ ...prev }));
    }
  }, [lotSize]);

  const handleKeyPress = (e: KeyboardEvent) => {
    const activeElement = document.activeElement;
    if (
      activeElement instanceof HTMLInputElement &&
      e.key !== "Enter" &&
      e.key !== "Escape"
    )
      return;

    if (e.key.toLowerCase() === "b") {
      console.log("b", orderState.qty);
      setOrderState((prev) => {
        return { ...prev, side: 1, qty: (lotSize * 2).toString() };
      });
      setIsVisible(true);
      setTimeout(() => {
        qtyInputRef.current?.focus();
        qtyInputRef.current?.select();
      }, 0);
    } else if (e.key.toLowerCase() === "s") {
      setOrderState((prev) => {
        return { ...prev, side: -1 };
      });
      setIsVisible(true);
      setTimeout(() => {
        qtyInputRef.current?.focus();
        qtyInputRef.current?.select();
      }, 0);
    } else if (e.key === "Escape") {
      closeWindow();
    } else if (e.key === "Enter" && isVisible) {
      handleOrder();
    }
  };

  useEffect(() => {
    if (chartKey !== selectedChartKey) return;

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [
    chartKey,
    isVisible,
    orderState.priceType,
    orderState.side,
    orderState.qty,
    selectedChartKey,
    handleKeyPress,
  ]);

  const prevIsVisible = useRef(false);
  useEffect(() => {
    if (currentPrice && isVisible) {
      if (prevIsVisible.current) {
        setOrderState((prev) => ({
          ...prev,
          price: currentPrice.toFixed(2),
          priceType: "LIMIT",
        }));
      }
      prevIsVisible.current = true;
    } else {
      prevIsVisible.current = false;
    }
  }, [currentPrice, isVisible]);

  const handleQtyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9]/g, "");
    setOrderState((prev) => ({ ...prev, qty: value }));
  };

  const toggleSide = () => {
    setOrderState((prev) => ({
      ...prev,
      side: prev.side === 1 ? -1 : 1,
    }));
  };

  const _placeOrder = async () => {
    await placeOrder({
      broker: "shoonya",
      qty: orderState.qty,
      side: orderState.side,
      type: 2,
      fyersSymbol: chartState.symbolInfo,
      price: 0,
      order_type: "MKT",
      trigger_price: orderState.price,
      frzqty:
        INDEX_DETAILS[
          getIndexNameFromOptionSymbol({
            symbol: chartState.symbolInfo.symbol,
          })
        ].freezeQty,
    });
    setIsVisible(false);
  };

  const handleAddOrder = () => {
    sendMessage("app", {
      _db: true,
      orders: [
        ...orders,
        {
          ...orderState,
          status: "OPEN",
          orderId: "order-" + Date.now().toString(),
          tickDataAtCreation: tickData,
        },
      ],
    });
  };

  const handleOrder = () => {
    if (orderState.priceType === "MARKET") {
      _placeOrder();
    } else {
      // Store the order in pending orders array
      handleAddOrder();
    }
    closeWindow();
  };

  // useEffect(() => {
  //   if (isVisible && qtyInputRef.current) {
  //     qtyInputRef.current.select();
  //   }
  // }, [isVisible]);

  if (!isVisible) return null;

  return (
    <div
      className={cn(
        "absolute right-16 top-16 bg-background/90 backdrop-blur-sm rounded-md p-1.5 border border-border z-[500] flex items-center gap-2 scale-90",
        className,
        orderState.side === 1 && "border-green-500/20",
        orderState.side === -1 && "border-red-500/20"
      )}
    >
      <button
        onClick={toggleSide}
        className={cn(
          "text-sm font-medium min-w-[50px] text-center",
          orderState.side === 1 ? "text-green-500" : "text-red-500"
        )}
      >
        {orderState.side === 1 ? "Buying" : "Selling"}
      </button>
      <Input
        ref={qtyInputRef}
        type="number"
        value={orderState.qty}
        onChange={(e) => handleQtyChange(e)}
        className="w-20 h-7 text-sm"
        placeholder="Qty"
        step={lotSize}
        hideArrows
        min={lotSize}
      />
      <span
        className="text-sm min-w-[80px] text-center"
        onClick={() =>
          setOrderState((prev) => ({ ...prev, priceType: "MARKET", price: "" }))
        }
      >
        at {orderState.price || tickData?.ltp || "MARKET"}
      </span>
      <Button
        onClick={handleOrder}
        className={cn(
          "h-7 px-3 text-sm text-white",
          orderState.side === 1
            ? "bg-green-500/80 hover:bg-green-500"
            : "bg-red-500/80 hover:bg-red-500"
        )}
      >
        Place
      </Button>
    </div>
  );
};
