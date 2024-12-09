import { useState, useEffect, memo, useRef } from "react";
import { Button } from "@repo/ui/button";
import { Input } from "@repo/ui/input";
import { cn } from "@repo/utils/ui/helpers";
import { round } from "../utils/drawingCoordinateUtils";
import { X } from "lucide-react";
import { placeOrder } from "../../../store/actions/orderActions";

interface BuySellWindowProps {
  className?: string;
  chartState: { symbol: string; timeframe: string };
  currentPrice?: number;
  rsiHeight: number;
}

export const BuySellWindow = ({
  className,
  chartState,
  currentPrice,
  rsiHeight,
}: BuySellWindowProps) => {
  const [qty, setQty] = useState<string>("1");
  const [limitPrice, setLimitPrice] = useState<string>("");
  const [slPrice, setSlPrice] = useState<string>("");
  const [timer, setTimer] = useState<NodeJS.Timeout | null>(null);
  const [isNearby, setIsNearby] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const formatPrice = (price: number): string => {
    const roundedPrice = round(price, 0.05);
    const priceStr = roundedPrice.toString();
    const [intPart = "0"] = priceStr.split(".");

    if (intPart.length >= 5) {
      return intPart.slice(0, 5);
    }

    return roundedPrice.toFixed(2);
  };

  useEffect(() => {
    if (currentPrice) {
      if (timer) {
        clearTimeout(timer);
      }

      setLimitPrice(formatPrice(currentPrice));
      const slValue = currentPrice * 0.9995;
      setSlPrice(formatPrice(slValue));

      const newTimer = setTimeout(() => {
        setLimitPrice("");
        setSlPrice("");
        setTimer(null);
      }, 4000) as unknown as NodeJS.Timeout;

      setTimer(newTimer);
    }
  }, [currentPrice]);

  useEffect(() => {
    return () => {
      if (timer) {
        clearTimeout(timer);
      }
    };
  }, [timer]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      const proximity = 40; // 40px proximity threshold

      // Calculate if mouse is within proximity of the container
      const isClose =
        e.clientX >= rect.left - proximity &&
        e.clientX <= rect.right + proximity &&
        e.clientY >= rect.top - proximity &&
        e.clientY <= rect.bottom + proximity;

      setIsNearby(isClose);
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  const handleQtyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9]/g, "");
    setQty(value);
  };

  const handlePriceChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: (value: string) => void
  ) => {
    const value = e.target.value.replace(/[^0-9.]/g, "");
    const parts = value.split(".");
    if (parts.length > 2) return;

    if (value) {
      const numValue = parseFloat(value);
      if (!isNaN(numValue)) {
        setter(formatPrice(numValue));
        return;
      }
    }
    setter(value);
  };

  const _placeOrder = (side = 1) => {
    placeOrder({
      broker: "shoonya",
      qty,
      side: side,
      type: 2,
      //   $symbol: data.tsym,
      //   $index: indexName,
      //   exchange: data.exch,
      price: limitPrice,
      fyersSymbol: chartState.symbol,
    });
  };

  const handleBuy = (e: React.MouseEvent<HTMLButtonElement>) => {
    _placeOrder(1);
    e.stopPropagation();
  };

  const handleSell = (e: React.MouseEvent<HTMLButtonElement>) => {
    _placeOrder(-1);
    e.stopPropagation();
  };

  const handleClearPrices = (e: React.MouseEvent) => {
    e.stopPropagation();
    setLimitPrice("");
    setSlPrice("");
    if (timer) {
      clearTimeout(timer);
      setTimer(null);
    }
  };

  const showPriceInputs = limitPrice || slPrice;

  return (
    <div
      ref={containerRef}
      className={cn(
        "absolute right-16 bg-background/25 backdrop-blur-sm rounded-md p-1 transition-opacity duration-200 border border-border z-40",
        timer || isNearby ? "opacity-100" : "opacity-25",
        className
      )}
      style={{
        bottom: `calc(10% + ${rsiHeight > 0 ? `${rsiHeight}px` : "0px"})`,
      }}
      onDoubleClick={(e) => e.stopPropagation()}
    >
      <div className="flex flex-col gap-1 w-[160px]">
        {showPriceInputs && (
          <div className="relative flex items-end">
            <div className="grid grid-cols-2 gap-1">
              <div className="flex flex-col gap-0.5">
                <label className="text-[10px] text-muted-foreground">
                  Limit
                </label>
                <Input
                  type="text"
                  value={limitPrice}
                  onChange={(e) => handlePriceChange(e, setLimitPrice)}
                  className="text-center h-6 text-xs px-1"
                  placeholder="0.00"
                />
              </div>
              <div className="flex flex-col gap-0.5">
                <label className="text-[10px] text-muted-foreground">SL</label>
                <Input
                  type="text"
                  value={slPrice}
                  onChange={(e) => handlePriceChange(e, setSlPrice)}
                  className="text-center h-6 text-xs px-1"
                  placeholder="0.00"
                />
              </div>
            </div>
            <button
              onClick={handleClearPrices}
              className="p-0.5 hover:bg-muted rounded-sm opacity-60 hover:opacity-100 mb-1 ml-1"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        <div className="flex gap-1">
          <Button
            onDoubleClick={handleBuy}
            className="flex-1 bg-green-500/80 hover:bg-green-500 text-white h-6 text-xs px-2"
          >
            Buy
          </Button>
          <Input
            type="text"
            value={qty}
            onChange={handleQtyChange}
            className="text-center w-12 h-6 text-xs px-1"
            placeholder="Qty"
          />
          <Button
            onDoubleClick={handleSell}
            className="flex-1 bg-red-500/80 hover:bg-red-500 text-white h-6 text-xs px-2"
          >
            Sell
          </Button>
        </div>
      </div>
    </div>
  );
};
