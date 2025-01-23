"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/card";
import { Calendar } from "lucide-react";
import { RootState } from "../../store/store";
import { useSelector } from "react-redux";

export function MarketHolidays() {
  const holidays = useSelector(
    (state: RootState) => state.states.app?.holidays || []
  );

  // Function to check if a date is tomorrow
  const isTomorrow = (dateStr: string) => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [day, month, year] = dateStr.split("-");
    const holidayDate = new Date(`${year}-${month}-${day}`);

    return tomorrow.toDateString() === holidayDate.toDateString();
  };

  // Filter future dates and get next 5 holidays
  const nextHolidays = holidays
    .filter((holiday: any) => {
      const [day, month, year] = holiday[0].split("-");
      const holidayDate = new Date(`${year}-${month}-${day}`);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return holidayDate >= today;
    })
    .slice(0, 5)
    .map((holiday: any, index: any) => ({
      date: holiday[0],
      reason: holiday[1],
      isTomorrow: index === 0 && isTomorrow(holiday[0]),
    }));

  return (
    <Card className="shadow-md">
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
        <CardTitle className="text-sm font-medium">Market Holidays</CardTitle>
        <Calendar className="w-4 h-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {nextHolidays.map((holiday: any, index: any) => (
            <div key={index} className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">
                {holiday.reason}
              </span>
              <span className="text-sm font-medium">
                {holiday.isTomorrow ? "Tomorrow" : holiday.date}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
