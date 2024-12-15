"use client";

import { useSelector } from "react-redux";
import { Card } from "@repo/ui/card";

interface FundInfoItem {
  label: string;
  value: number | string;
  className?: string;
}

export function FundInfoDisplay() {
  const { fundInfo = {} } = useSelector(
    (state: any) => state.states.shoonya || {}
  );

  const fundInfoItems: FundInfoItem[] = [
    { label: "Open Balance", value: fundInfo.openBalance || 0 },
    { label: "Pay IN", value: fundInfo.payin || 0 },
    { label: "Margin Used", value: fundInfo.marginused || 0 },
    { label: "Brokerage", value: fundInfo.brokerage || 0 },
    {
      label: "Available Margin",
      value: fundInfo.marginAvailable || 0,
      className: "text-green-500",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-4">
      {fundInfoItems.map((item, index) => (
        <Card key={index} className="p-4 bg-card/50">
          <p className="text-sm text-muted-foreground">{item.label}</p>
          <p className={`text-lg font-semibold mt-1 ${item.className || ""}`}>
            ₹
            {typeof item.value === "number"
              ? item.value.toFixed(2)
              : item.value}
          </p>
        </Card>
      ))}
    </div>
  );
}
