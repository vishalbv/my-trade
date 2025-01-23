import React, { useRef, useEffect, useState, useCallback } from "react";
import { ChartTheme } from "../types";
import { cn } from "@repo/utils/ui/helpers";
import debounce from "lodash/debounce";
import { Input } from "@repo/ui/input";

interface OrderLabelProps {
  orderId: string;
  price: string;
  quantity?: string;
  position: { x: number; y: number };

  theme: ChartTheme;
  onQuantityChange: (orderId: string, quantity: string) => void;
  onCancel: (orderId: string) => void;
  onDragStart?: (orderId: string, y: number) => void;
  onDrag?: (y: number) => void;
  onDragEnd?: () => void;
  isDragging?: boolean;
  side: 1 | -1;
  lotSize: number;
}

export const OrderLabel: React.FC<OrderLabelProps> = ({
  orderId,
  price,
  quantity = "0",
  position,
  theme,
  onQuantityChange,
  onCancel,
  onDragStart,
  onDrag,
  onDragEnd,
  isDragging,
  side,
  lotSize,
}) => {
  const labelRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);
  const dragOffsetRef = useRef<number>(0);
  const [localQuantity, setLocalQuantity] = useState(quantity);

  const debouncedQuantityChange = useCallback(
    debounce((orderId: string, value: string) => {
      onQuantityChange(orderId, value);
    }, 2000),
    [onQuantityChange]
  );

  useEffect(() => {
    setLocalQuantity(quantity);
  }, [quantity]);

  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setLocalQuantity(newValue);
    debouncedQuantityChange(orderId, newValue);
  };

  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (isDraggingRef.current && onDrag) {
        e.preventDefault();
        e.stopPropagation();

        // Direct position update
        const newY = e.clientY - dragOffsetRef.current;
        requestAnimationFrame(() => {
          if (isDraggingRef.current) {
            onDrag(newY);
          }
        });
      }
    };

    const handleGlobalMouseUp = (e: MouseEvent) => {
      if (isDraggingRef.current && onDragEnd) {
        e.preventDefault();
        e.stopPropagation();

        isDraggingRef.current = false;
        dragOffsetRef.current = 0;
        onDragEnd();
      }
    };

    document.addEventListener("mousemove", handleGlobalMouseMove, {
      capture: true,
      passive: false,
    });
    document.addEventListener("mouseup", handleGlobalMouseUp, {
      capture: true,
      passive: false,
    });

    return () => {
      document.removeEventListener("mousemove", handleGlobalMouseMove, {
        capture: true,
      });
      document.removeEventListener("mouseup", handleGlobalMouseUp, {
        capture: true,
      });
    };
  }, [onDrag, onDragEnd]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.target instanceof HTMLElement) {
      e.preventDefault();
      e.stopPropagation();

      dragOffsetRef.current = e.clientY - position.y;
      isDraggingRef.current = true;
      onDragStart?.(orderId, position.y);
    }
  };

  return (
    <div
      ref={labelRef}
      onMouseDown={handleMouseDown}
      className={cn(
        "absolute right-0 flex items-center z-[150] w-full select-none touch-none",
        isDragging ? "cursor-grabbing" : "cursor-grab"
      )}
      style={{
        top: position.y - 12,
        transform: "translate3d(0, 0, 0)",
        backfaceVisibility: "hidden",
        willChange: "transform",
        WebkitTapHighlightColor: "transparent",
        WebkitTouchCallout: "none",
        WebkitUserSelect: "none",
      }}
    >
      <div className="relative flex items-center w-full h-6">
        {/* Order label with input and cancel button */}
        <span className="flex items-center justify-center flex-1 h-full">
          <svg width="100%" height="1px">
            <line
              x1="0"
              y1="1"
              x2="100%"
              y2="1"
              strokeWidth="1"
              stroke={side === 1 ? theme.upColor : theme.downColor}
              strokeDasharray="2,2"
              vectorEffect="non-scaling-stroke"
            />
          </svg>
        </span>
        <style>
          {`
            .relative:hover line {
              stroke-width: 2;
            }
            .relative.dragging line {
              stroke-width: 2;
            }
          `}
        </style>

        <span
          className={cn(
            "flex items-center gap-2 px-2 py-0 rounded-full h-full",
            "w-[80px] border border-0.5 bg-background"
            // isActive ? "bg-text border-text" : cn("bg-background")
          )}
          style={{
            borderColor: side === 1 ? theme.upColor : theme.downColor,
          }}
        >
          <Input
            type={localQuantity ? "number" : "text"}
            value={localQuantity}
            placeholder="ALL"
            onChange={handleQuantityChange}
            onClick={(e: React.MouseEvent<HTMLInputElement>) =>
              (e.target as HTMLInputElement).select()
            }
            hideArrows
            step={lotSize}
            className={cn(
              "w-10 bg-transparent border-none text-left text-xs cursor-grab h-full focus:outline-none active:outline-none focus-visible:outline-none focus-visible:ring-0 p-0 pl-1"
              //   isActive ? "text-background" : "text-text"
            )}
          />
          <button
            onClick={() => onCancel(orderId)}
            className={cn(
              "flex items-center justify-center p-0.5 text-sm",
              "bg-transparent border-none cursor-pointer"
              //   isActive ? "text-background" : "text-text"
            )}
          >
            ✕
          </button>
        </span>

        {/* Dashed line */}
        {/* <span className="flex items-center justify-center flex-1 h-full">
          <svg width="100%" height="1px">
            <line
              x1="0"
              y1="1"
              x2="100"
              y2="1"
              strokeWidth="2"
              stroke={isActive ? theme.text : theme.crosshair}
              strokeDasharray="2,2"
              vectorEffect="non-scaling-stroke"
            />
          </svg>
        </span> */}

        {/* Y-axis price label */}
        <span
          className={cn(
            "min-w-[50px] px-1 py-0 rounded text-center h-5 flex items-center justify-center text-white mr-2"
          )}
          style={{ background: side === 1 ? theme.upColor : theme.downColor }}
        >
          <span className="text-2xs font-bold">
            {parseFloat(price).toFixed(2)}
          </span>
        </span>
      </div>
    </div>
  );
};
