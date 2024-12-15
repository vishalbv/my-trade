"use client";

import { useMemo } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@repo/ui/tooltip";

interface PLHeatmapProps {
  reports: Array<{
    id: string;
    shoonya: {
      fundInfo: {
        pl: number;
      };
    };
  }>;
}

const PLHeatmap = ({ reports }: PLHeatmapProps) => {
  const monthNames = [
    "APR",
    "MAY",
    "JUN",
    "JUL",
    "AUG",
    "SEP",
    "OCT",
    "NOV",
    "DEC",
    "JAN",
    "FEB",
    "MAR",
  ];

  const weekDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  const processedData = useMemo(() => {
    // Group reports by month and day
    const groupedByMonth = reports.reduce(
      (acc, report) => {
        const date = new Date(report.id.split("-").reverse().join("-"));
        const month = date.getMonth();
        const day = date.getDate();

        if (!acc[month]) {
          acc[month] = {};
        }

        acc[month][day] = {
          date,
          pl: report.shoonya.fundInfo?.pl || 0,
        };

        return acc;
      },
      {} as Record<number, Record<number, { date: Date; pl: number }>>
    );

    // Find max profit and loss for color scaling
    const allPLs = reports.map((r) => r.shoonya.fundInfo?.pl || 0);
    const maxProfit = Math.max(...allPLs, 0);
    const maxLoss = Math.min(...allPLs, 0);

    return {
      groupedByMonth,
      maxProfit,
      maxLoss,
    };
  }, [reports]);

  const getColorIntensity = (pl: number | null) => {
    if (pl === null || pl === 0 || pl === undefined)
      return "bg-muted border border-muted";

    const { maxProfit, maxLoss } = processedData;
    const intensity =
      pl > 0
        ? Math.min(Math.ceil((pl / maxProfit) * 5), 5)
        : Math.min(Math.ceil((pl / maxLoss) * 5), 5);

    if (pl > 0) {
      const greenShades = {
        1: "bg-green-200",
        2: "bg-green-200",
        3: "bg-green-300",
        4: "bg-green-400",
        5: "bg-green-500",
      };
      return greenShades[intensity as keyof typeof greenShades];
    } else {
      const redShades = {
        1: "bg-red-200",
        2: "bg-red-200",
        3: "bg-red-300",
        4: "bg-red-400",
        5: "bg-red-500",
      };
      return redShades[Math.abs(intensity) as keyof typeof redShades];
    }
  };

  const getDaysInMonth = (
    month: number,
    year: number = new Date().getFullYear()
  ) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (
    month: number,
    year: number = new Date().getFullYear()
  ) => {
    return new Date(year, month, 1).getDay();
  };

  const generateMonthGrid = (monthIndex: number) => {
    const daysInMonth = getDaysInMonth(monthIndex);
    const firstDay = getFirstDayOfMonth(monthIndex);
    const totalWeeks = Math.ceil((daysInMonth + firstDay) / 7);

    // Initialize grid with 7 rows (days) and totalWeeks columns
    const grid = Array(7)
      .fill(null)
      .map(() => Array(totalWeeks).fill(null));

    let currentDay = 1;

    // Fill in the grid
    for (let week = 0; week < totalWeeks; week++) {
      for (let day = 0; day < 7; day++) {
        if (week === 0 && day < firstDay) {
          // Skip days before the first of the month
          continue;
        }
        if (currentDay > daysInMonth) {
          // Stop after we've filled in all days of the month
          break;
        }
        grid[day][week] = {
          day: currentDay,
          ...processedData.groupedByMonth[monthIndex]?.[currentDay],
        };
        currentDay++;
      }
    }

    return grid;
  };

  return (
    <div className="w-full max-w-7xl mx-auto">
      <h2 className="text-xl font-semibold mb-6">
        Net realised P&L for Financial Year
      </h2>

      <div className="flex gap-4">
        {/* Vertical weekday headers */}
        <div className="flex flex-col gap-[2px] pr-0 mt-7">
          {weekDays.map((day) => (
            <div
              key={day}
              className="h-4 w-4 text-[10px] text-gray-500 text-right"
            >
              {day[0]}
            </div>
          ))}
        </div>

        {/* Months grid */}
        <div className="flex flex-1 gap-3">
          {monthNames.map((month, monthIndex) => {
            const monthGrid = generateMonthGrid(monthIndex);

            return (
              <div key={month} className="flex flex-col">
                <div className="text-sm font-medium text-gray-500 mb-2 text-center">
                  {month}
                </div>
                <div className="flex flex-col gap-[2px]">
                  {monthGrid.map((dayRow, dayIndex) => (
                    <div key={dayIndex} className="flex gap-[2px]">
                      {dayRow.map((dayData, weekIndex) => (
                        <TooltipProvider key={weekIndex} delayDuration={100}>
                          <Tooltip>
                            <TooltipTrigger>
                              <div
                                className={`w-[16px] h-[16px] rounded-xs transform transition-transform ${
                                  dayData?.pl
                                    ? "hover:scale-125"
                                    : "hover:scale-100"
                                } ${
                                  dayData
                                    ? getColorIntensity(dayData.pl ?? null)
                                    : "bg-transparent"
                                }`}
                              />
                            </TooltipTrigger>
                            {dayData?.date && (
                              <TooltipContent className="bg-background border border-muted-foreground">
                                <div className="text-sm text-muted-foreground">
                                  <div>{dayData.date.toLocaleDateString()}</div>
                                  <div
                                    className={
                                      dayData.pl >= 0
                                        ? "text-green-500"
                                        : "text-red-500"
                                    }
                                  >
                                    ₹{dayData.pl.toFixed(2)}
                                  </div>
                                </div>
                              </TooltipContent>
                            )}
                          </Tooltip>
                        </TooltipProvider>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default PLHeatmap;
