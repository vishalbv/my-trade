"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/card";
import { CalendarDays } from "lucide-react";
import { useSelector } from "react-redux";
import { RootState } from "../../store/store";
import moment from "moment";

export function MarketInfo() {
  const upcomingExpiryDates = useSelector(
    (state: RootState) => state.states.app?.upcomingExpiryDates || []
  );

  const expiries = Object.keys(upcomingExpiryDates)
    .map((key, index) => {
      return {
        key,
        date: upcomingExpiryDates[key][0].date,
        daysToGo:
          moment(upcomingExpiryDates[key][0].date, "DD-MM-YYYY").diff(
            moment(),
            "days"
          ) + 1,
      };
    })
    .sort((a, b) => {
      return moment(a.date, "DD-MM-YYYY").isBefore(moment(b.date, "DD-MM-YYYY"))
        ? -1
        : 1;
    });

  return (
    <Card className="shadow-md">
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
        <CardTitle className="text-sm font-medium">
          Market Information
        </CardTitle>
        <CalendarDays className="w-4 h-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {expiries.map((expiry, index) => (
            <div key={index} className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground w-32 inline-flex justify-between">
                {expiry.key}
              </span>
              <span
                className={`text-sm w-40 ${
                  expiry.daysToGo === 0
                    ? "font-bold text-green-600"
                    : expiry.daysToGo === 1
                      ? "font-bold text-blue-600"
                      : "font-medium"
                }`}
              >
                {expiry.daysToGo === 0 ? (
                  "Today"
                ) : expiry.daysToGo === 1 ? (
                  "Tomorrow"
                ) : (
                  <span className="flex justify-between items-center flex-1">
                    <span className="text-muted-foreground inline-flex justify-between">
                      {expiry.date}
                    </span>{" "}
                    {expiry.daysToGo} days
                  </span>
                )}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
