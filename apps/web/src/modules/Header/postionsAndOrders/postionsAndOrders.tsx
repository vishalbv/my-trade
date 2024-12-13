import React from "react";
import { Positions } from "./postions";
import { Orders } from "./orders";

export const PositionsAndOrders: React.FC = () => {
  return (
    <div className="w-full border-t border-border max-h-[400px] overflow-auto bg-background/30">
      <div className="flex w-full">
        <div className="w-1/2 flex">
          <Header title="POSITIONS" />

          <Positions />
        </div>

        <div className="w-1/2 flex border-l border-border">
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
