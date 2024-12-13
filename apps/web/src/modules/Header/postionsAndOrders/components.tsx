import React from "react";
import { cn } from "@repo/utils/ui/helpers";

export const DisplayName: React.FC<{ dname?: string; tsym?: string }> = ({
  dname,
  tsym,
}) => {
  const parts = dname
    ? dname.split(" ").filter((_, k) => k !== 1)
    : tsym
        ?.match(/[\d.]+|\D+/g)
        .filter((_, k) => k !== 1 && k !== 2)
        ?.map((i, k, arr) => (k == arr.length - 2 ? i.slice(-5) : i));

  if (!parts) return null;

  return (
    <div className="flex gap-0.5">
      {parts.map((part, index) => (
        <span
          key={index}
          className={cn("text-xs", index !== 0 && "font-medium")}
        >
          {part}
        </span>
      ))}
    </div>
  );
};

export const Header: React.FC<{ title: string }> = ({ title }) => {
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
