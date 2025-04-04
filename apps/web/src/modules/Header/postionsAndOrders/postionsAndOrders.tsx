import React from "react";
import { Positions } from "./postions";
import { Orders } from "./orders";
import { CloseAllDropdown } from "./CloseAllDropdown";

export const PositionsAndOrders: React.FC = () => {
  return (
    <div className="w-full border-t border-border h-full overflow-auto bg-background/30">
      <div className="flex h-full">
        <div className="flex-1 flex">
          <Positions />
          <Header title="POSITIONS" />
        </div>

        <CloseAllDropdown />

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
