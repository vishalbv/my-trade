"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/card";
import { Calendar } from "lucide-react";

export function MarketHolidays() {
  // This could be fetched from an API
  const nextHoliday = "26th Dec 2024";

  return (
    <Card className="shadow-md">
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
        <CardTitle className="text-sm font-medium">Market Holidays</CardTitle>
        <Calendar className="w-4 h-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Next Holiday</span>
            <span className="font-medium">{nextHoliday}</span>
          </div>
          <p className="text-xs text-muted-foreground">Christmas Day</p>
        </div>
      </CardContent>
    </Card>
  );
}
