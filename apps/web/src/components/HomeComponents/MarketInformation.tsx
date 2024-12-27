"use client";

import { Card } from "@repo/ui/card";
import { useSelector } from "react-redux";
import { cn } from "@repo/utils/ui/helpers";
import { PRICECOLOR } from "../../utils/helpers";
import moment from "moment";
import { RootState } from "../../store/store";
import { INDEX_DETAILS } from "@repo/utils/constants";

interface IndexInfo {
  name: string;
  token: string;
}

export function MarketInformation() {
  const ticks = useSelector((state: any) => state.ticks?.shoonya_server || {});

  const upcomingExpiryDates = useSelector(
    (state: RootState) => state.states.app?.upcomingExpiryDates || []
  );

  // Get expiry information for each index
  const getExpiryInfo = (indexName: string) => {
    const key = Object.keys(upcomingExpiryDates).find((k) =>
      k.includes(indexName)
    );
    if (!key || !upcomingExpiryDates[key]?.[0]) return null;

    const expiryDate = upcomingExpiryDates[key][0].date;
    // Only consider the date part, ignore time
    const expiryMoment = moment(expiryDate, "DD-MM-YYYY").startOf("day");
    const now = moment().startOf("day");

    // Calculate difference in days directly
    const daysToGo = expiryMoment.diff(now, "days");
    return { date: expiryDate, daysToGo };
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
      {Object.values(INDEX_DETAILS).map((index) => {
        const tickData = ticks[index.shoonyaToken];
        const expiryInfo = getExpiryInfo(index.name);

        return (
          <Card
            key={index.shoonyaToken}
            className="p-3 bg-muted/50 hover:bg-muted/70 transition-colors"
          >
            <div className="flex flex-col gap-2">
              {/* Index Name */}
              <div className="text-sm font-semibold text-muted-foreground">
                {index.name}
              </div>

              {/* Price and Change */}
              <div className="flex items-baseline gap-2">
                <span className="text-lg tabular-nums">
                  {tickData?.lp || "---"}
                </span>
                {tickData?.pc && (
                  <span
                    className={cn(
                      "text-xs tabular-nums",
                      PRICECOLOR(tickData.pc)
                    )}
                  >
                    {tickData.pc > 0 ? "+" : ""}
                    {tickData.pc}%
                  </span>
                )}
              </div>

              {/* Expiry Info */}
              {expiryInfo && (
                <div className="flex items-center justify-between text-xs text-muted-foreground mt-1">
                  <span>{expiryInfo.date}</span>
                  <span className="tabular-nums">
                    {expiryInfo.daysToGo === 0 ? (
                      <span className="text-primary text-sm text-yellow-500">
                        Today Expiry
                      </span>
                    ) : expiryInfo.daysToGo === 1 ? (
                      <span className="text-primary text-sm">Tomorrow</span>
                    ) : (
                      <span className="">{expiryInfo.daysToGo} days left</span>
                    )}
                  </span>
                </div>
              )}
            </div>
          </Card>
        );
      })}
    </div>
  );
}
