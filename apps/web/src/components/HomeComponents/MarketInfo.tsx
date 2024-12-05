"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/card";
import { CalendarDays } from "lucide-react";

export function MarketInfo() {
  return (
    <Card className="shadow-md">
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
        <CardTitle className="text-sm font-medium">
          Market Information
        </CardTitle>
        <CalendarDays className="w-4 h-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <ExpiryInfo title="Today's Expiry" instrument="BANKNIFTY" />
          <ExpiryInfo title="Tomorrow's Expiry" instrument="NIFTY" />
          <ExpiryInfo title="This Friday" instrument="SENSEX" />
        </div>
      </CardContent>
    </Card>
  );
}

function ExpiryInfo({
  title,
  instrument,
}: {
  title: string;
  instrument: string;
}) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-sm text-muted-foreground">{title}</span>
      <span className="font-medium">{instrument}</span>
    </div>
  );
}
