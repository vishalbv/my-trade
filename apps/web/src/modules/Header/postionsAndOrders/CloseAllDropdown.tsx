import React, { useState, useRef, useEffect } from "react";
import { Button } from "@repo/ui/button";
import { X, MoveLeft, ChevronDown } from "lucide-react";
import { closeAll } from "../../../store/actions/orderActions";

const DROPDOWN_ITEMS = [
  { label: " Positions", type: "positions" },
  { label: " Orders", type: "orders" },
  { label: " Index Options", type: "indexOptions" },
  { label: " Stock Options", type: "stockOptions" },
] as const;

export const CloseAllDropdown: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const clickTimeout = useRef<NodeJS.Timeout>();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleClick = () => {
    if (clickTimeout.current) {
      // Double click detected
      clearTimeout(clickTimeout.current);
      clickTimeout.current = undefined;
      closeAll({ broker: "shoonya", type: "positions" });
      setIsOpen(false);
    } else {
      // Single click
      clickTimeout.current = setTimeout(() => {
        clickTimeout.current = undefined;
        setIsOpen(!isOpen);
      }, 200); // 200ms threshold for double click
    }
  };

  return (
    <div className="w-[200px] flex border-l border-border">
      <div className="flex-1 flex flex-col items-center gap-4 p-4">
        <div className="relative w-full" ref={dropdownRef}>
          <Button
            variant="secondary"
            size="sm"
            className="w-full flex items-center gap-2 border border-destructive hover:text-destructive"
            onClick={handleClick}
          >
            <X size={16} />
            Close All
            <ChevronDown size={16} className="ml-auto" />
          </Button>

          {isOpen && (
            <div className="absolute top-full left-0 w-full mt-1 bg-background border border-border rounded-md shadow-lg z-50">
              {DROPDOWN_ITEMS.map((item) => (
                <div
                  key={item.type}
                  className="px-2 py-1 hover:bg-muted cursor-pointer text-sm"
                  onClick={() => {
                    closeAll({ broker: "shoonya", type: item.type });
                    setIsOpen(false);
                  }}
                >
                  {item.label}
                </div>
              ))}
            </div>
          )}
        </div>

        <Button
          variant="secondary"
          size="sm"
          className="w-full flex items-center gap-2"
        >
          <MoveLeft size={16} />
          Move Orders
        </Button>
      </div>
    </div>
  );
};
