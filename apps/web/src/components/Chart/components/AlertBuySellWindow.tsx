import { useState, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@repo/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@repo/ui/popover";
import { Button } from "@repo/ui/button";
import { BellIcon, BellOffIcon, Trash2Icon } from "lucide-react";
import {
  addAlert,
  updateAlert,
  deleteAlert,
} from "../../../store/actions/alertActions";
import type { RootState } from "../../../store/store";
import type { AppDispatch } from "../../../store/store";
import { Alert, Drawing } from "../types";
import { fyersDataSocketService } from "../../../services/fyersDataSocket";

export type AlertType =
  | "priceBelow"
  | "priceAbove"
  | "priceBetween"
  | "priceTouch";

interface AlertBuySellWindowProps {
  symbol: string;
  selectedDrawing: { drawing: Drawing; symbol: string };
  onClose: () => void;
}

const timeframeOptions = [
  { value: "", label: "Real Time" },
  { value: "1", label: "1 Minute" },
  { value: "5", label: "5 Minutes" },
  { value: "15", label: "15 Minutes" },
  { value: "D", label: "1 Day" },
];

const alertTypeOptions = [
  { value: "priceBelow", label: "Price Below" },
  { value: "priceAbove", label: "Price Above" },
  { value: "priceBetween", label: "Price Between" },
  { value: "priceTouch", label: "Price Touch" },
] as const;

const drawingTypeToAlertMapping = {
  rect: [
    {
      value: "priceMoveOut",
      label: "Price Move Out of Zone",
    },
  ],
  fibonacci: [
    {
      value: "falseBreakout.0.618",
      label: "0.618 false breakout",
    },
    {
      value: "priceMoveOut",
      label: "Price Move Out of Zone",
    },
  ],
  horizontalLine: [
    {
      value: "priceTouch",
      label: "Price Touch",
    },
    {
      value: "priceAbove",
      label: "Price Above",
    },
    {
      value: "priceBelow",
      label: "Price Below",
    },
  ],
};

export const AlertBuySellWindow = ({
  selectedDrawing,
  onClose,
}: AlertBuySellWindowProps) => {
  const dispatch = useDispatch<any>();
  const { drawing, symbol } = selectedDrawing;

  const alerts = useSelector(
    (state: RootState) => state.states.alerts?.[drawing.id] || []
  );

  const tickData = useSelector((state: any) => state.ticks?.fyers_web[symbol]);

  const [editingAlertId, setEditingAlertId] = useState<string | null>(null);
  const [newAlert, setNewAlert] = useState<Alert>({
    id: "-1",
    drawingId: drawing.id,
    timeframe: "",
    isEnabled: true,
    type: "",
    muted: false,
  });

  const handleAddAlert = () => {
    dispatch(
      addAlert({
        drawingId: drawing.id,
        alert: {
          ...newAlert,
          id: "alert-" + Date.now().toString(),
          tickDataAtCreation: tickData,
          symbol,
        },
      })
    );
    setNewAlert({
      id: "-1",
      drawingId: drawing.id,
      timeframe: "",
      isEnabled: true,
      type: "",
      muted: false,
    });
  };

  const handleDeleteAlert = (alertId: string) => {
    dispatch(deleteAlert({ drawingId: drawing.id, alertId }));
  };

  const handleAlertUpdate = (alertId: string, updates: Record<string, any>) => {
    if (alertId === "-1") {
      setNewAlert({
        ...newAlert,
        ...updates,
      });
      return;
    }

    dispatch(
      updateAlert({
        drawingId: drawing.id,
        alert: {
          id: alertId,
          ...updates,
          tickDataAtCreation: tickData,
        },
      })
    );
  };

  const alertTypeOptions = drawingTypeToAlertMapping[drawing.type] || [];

  return (
    <Popover className="z-[999]">
      <PopoverTrigger asChild>
        <Button
          variant="primary-hover"
          className="flex items-center gap-1 py-0.5 h-5 px-1.5 bg-red-500/10"
          size="sm"
        >
          Alert <BellIcon className="h-3 w-3" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="min-w-[350px] p-2" align="end">
        <div className="flex flex-col space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium ml-2">Alert Settings</span>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={onClose}
            >
              ✕
            </Button>
          </div>

          <div className="space-y-1">
            {[...alerts, newAlert].map((alert: any) => (
              <div
                key={alert.id}
                className="flex items-center gap-2 p-1 rounded hover:bg-muted cursor-pointer"
                onClick={() => setEditingAlertId(alert.id)}
              >
                <div className="flex items-center gap-2 flex-1">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-6 px-2 min-w-12"
                      >
                        {
                          alertTypeOptions.find(
                            (opt) => opt.value === alert.type
                          )?.label
                        }
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start">
                      {alertTypeOptions.map((option) => (
                        <DropdownMenuItem
                          key={option.value}
                          onClick={() =>
                            handleAlertUpdate(alert.id, {
                              type: option.value,
                            })
                          }
                          className="py-1"
                        >
                          {option.label}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <span className="text-xs text-muted-foreground">in</span>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-6 px-2 min-w-12"
                      >
                        {
                          timeframeOptions.find(
                            (opt) => opt.value === alert.timeframe
                          )?.label
                        }
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {timeframeOptions.map((option) => (
                        <DropdownMenuItem
                          key={option.value}
                          onClick={() =>
                            handleAlertUpdate(alert.id, {
                              timeframe: option.value,
                            })
                          }
                          className="py-1"
                        >
                          {option.label}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>

                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAlertUpdate(alert.id, {
                        isEnabled: !alert.isEnabled,
                      });
                    }}
                    className={`h-6 w-6 ${
                      alert.isEnabled ? "text-primary" : "text-muted-foreground"
                    }`}
                  >
                    {alert.isEnabled ? (
                      <BellIcon className="h-3 w-3" />
                    ) : (
                      <BellOffIcon className="h-3 w-3" />
                    )}
                  </Button>
                </div>

                {alert.id === "-1" ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleAddAlert}
                    className="h-6 mx-auto py-2"
                  >
                    Add
                  </Button>
                ) : (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteAlert(alert.id);
                    }}
                    className="text-destructive hover:text-destructive h-6 w-6 hover:bg-destructive/10 ml-auto"
                  >
                    <Trash2Icon className="h-3 w-3" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};
