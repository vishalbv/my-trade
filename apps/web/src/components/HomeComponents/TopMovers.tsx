"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/card";
import { cn } from "@repo/utils/ui/helpers";
import { TrendingUp, TrendingDown } from "lucide-react";

export function TopMovers() {
  // This data should come from your API
  const gainers = [
    { symbol: "TCS", change: "+2.5%" },
    { symbol: "INFY", change: "+2.1%" },
    { symbol: "RELIANCE", change: "+1.8%" },
    { symbol: "HDFC", change: "+1.5%" },
    { symbol: "ITC", change: "+1.2%" },
  ];

  const losers = [
    { symbol: "BHARTIARTL", change: "-1.8%" },
    { symbol: "HCLTECH", change: "-1.5%" },
    { symbol: "WIPRO", change: "-1.3%" },
    { symbol: "SUNPHARMA", change: "-1.2%" },
    { symbol: "TATASTEEL", change: "-1.0%" },
  ];

  return (
    <Card className="shadow-md">
      <CardContent className="flex justify-between mt-4">
        <Block
          title="Top Gainers"
          icon={<TrendingUp className="w-4 h-4 text-green-500" />}
          data={gainers}
        />
        <Block
          title="Top Losers"
          icon={<TrendingDown className="w-4 h-4 text-red-500" />}
          data={losers}
        />
      </CardContent>
    </Card>
  );
}

const Block = ({
  title,
  icon,
  data,
}: {
  title: string;
  icon: React.ReactNode;
  data: { symbol: string; change: string }[];
}) => {
  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <h3 className="text-sm font-medium">{title}</h3>
      </div>
      <div className="space-y-2">
        {data.map((stock) => (
          <div
            key={stock.symbol}
            className="flex justify-between items-center gap-2"
          >
            <span className="text-sm">{stock.symbol}</span>
            <span
              className={cn(
                "text-sm",
                stock.change.startsWith("+") ? "text-green-500" : "text-red-500"
              )}
            >
              {stock.change}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
