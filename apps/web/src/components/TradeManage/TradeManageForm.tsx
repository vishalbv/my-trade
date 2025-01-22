"use client";

import { useSelector } from "react-redux";
import { useState } from "react";
import moment from "moment";

import { sendMessage } from "../../services/webSocket";
import { Input } from "@repo/ui/input";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@repo/ui/tooltip";
import { Switch } from "@repo/ui/switch";
import { Label } from "@repo/ui/label";

const maxIcanSet = {
  maxLossOfDay: 20,
  maxNoOfTrades: 100,
  maxBrokerage: 8,
  securePercentage: 50,
  extendedLoss: 15,
};

export function TradeManageForm() {
  const { moneyManage = {} } = useSelector(
    (state: any) => state.states.shoonya || {}
  );

  const setShoonyaMoneyManage = (data: any) => {
    sendMessage("shoonya", {
      moneyManage: { ...moneyManage, ...data },
      _db: true,
    });
  };

  return (
    <div className="space-y-6">
      {/* Max Loss Daily */}
      <div className="space-y-2">
        <Label htmlFor="maxLossDaily">Max Loss (Daily)</Label>
        <div className="flex items-center gap-2">
          <Input
            id="maxLossDaily"
            type="number"
            value={moneyManage.maxLossOfDay || 0}
            disabled={moneyManage.isExtendedMaxLossOfDay}
            onChange={(e) => {
              const value = Number(e.target.value);
              if (value <= maxIcanSet.maxLossOfDay && value >= 0) {
                setShoonyaMoneyManage({ maxLossOfDay: value });
              }
            }}
          />
          <span className="text-sm">%</span>
        </div>
      </div>

      {/* Extended Loss Switch */}
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <Label>Extend {maxIcanSet.extendedLoss}%</Label>
          <p className="text-sm text-muted-foreground">
            Current max loss: ₹{moneyManage?.maxLossOfDayInRs || 0}
          </p>
        </div>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <Switch
                disabled={
                  moneyManage.isExtendedMaxLossOfDay ||
                  moment().isBefore(moment().set({ hours: 14, minutes: 0 }))
                }
                checked={moneyManage.isExtendedMaxLossOfDay || false}
                onCheckedChange={(checked) => {
                  setShoonyaMoneyManage({
                    isExtendedMaxLossOfDay: checked,
                  });
                }}
              />
            </TooltipTrigger>
            <TooltipContent>
              {moneyManage.isExtendedMaxLossOfDay
                ? "Con't disable back"
                : "Cannot enable before 2 PM"}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* Other parameters */}
      <div className="space-y-4">
        {[
          {
            id: "maxTrades",
            label: "Max Trades (Daily)",
            value: moneyManage.maxNoOfTrades,
            max: maxIcanSet.maxNoOfTrades,
            suffix: "",
            onChange: (value: number) =>
              setShoonyaMoneyManage({ maxNoOfTrades: value }),
          },

          {
            id: "secureProfit",
            label: "Secure Profit Percentage",
            value: moneyManage.securePercentage,
            max: maxIcanSet.securePercentage,
            suffix: "%",
            onChange: (value: number) =>
              setShoonyaMoneyManage({ securePercentage: value }),
          },
        ].map((field) => (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={field.id}>{field.label}</Label>
            <div className="flex items-center gap-2">
              <Input
                id={field.id}
                type="number"
                value={field.value || 0}
                onChange={(e) => {
                  const value = Number(e.target.value);
                  if (value <= field.max && value >= 0) {
                    field.onChange(value);
                  }
                }}
              />
              <span className="text-sm">{field.suffix}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
