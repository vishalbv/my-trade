import React from "react";
import { Positions } from "./postions";
import { Orders } from "./orders";
import { Button } from "@repo/ui/button";
import { X, MoveLeft } from "lucide-react";

export const PositionsAndOrders: React.FC = () => {
  return (
    <div className="w-full border-t border-border max-h-[400px] overflow-auto bg-background/30">
      <div className="flex w-full">
        <div className="flex-1 flex">
          <Positions />
          <Header title="POSITIONS" />
        </div>

        <div className="w-[200px] flex border-l border-border">
          <div className="flex-1 flex flex-col items-center justify-center gap-4 p-4">
            <Button
              variant="secondary"
              size="sm"
              className="w-full flex items-center gap-2 border border-destructive"
            >
              <X size={16} />
              Close All
            </Button>
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

        <div className="flex-1 flex border-l border-border">
          <Header title="ORDERS" />

          <Orders />
        </div>
      </div>
    </div>
  );
};

const Header = ({ title }: { title: string }) => {
  return (
    <div className="w-8 border-r border-border flex items-center justify-center bg-primary/10">
      <div className="flex flex-col items-center text-sm font-semibold py-2 text-primary">
        {title.split("").map((letter, index) => (
          <span key={index} className="leading-tight">
            {letter}
          </span>
        ))}
      </div>
    </div>
  );
};
