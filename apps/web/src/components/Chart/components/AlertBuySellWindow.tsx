import { useState, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { ThunkDispatch } from "redux-thunk";
import { AnyAction } from "redux";
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
  toggleAlertEnabled,
} from "../../../store/actions/alertActions";
import type { RootState } from "../../../store/store";
import type { AppDispatch } from "../../../store/store";

export type AlertType =
  | "priceBelow"
  | "priceAbove"
  | "priceBetween"
  | "priceTouch";

interface AlertBuySellWindowProps {
  symbol: string;
  drawingId: string;
  onClose: () => void;
}

const timeframeOptions = [
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

export const AlertBuySellWindow = ({
  symbol,
  drawingId,
  onClose,
}: AlertBuySellWindowProps) => {
  const dispatch = useDispatch<any>();
  const alerts = useSelector(
    (state: RootState) => state.states.alerts?.[drawingId] || []
  );
  const [editingAlertId, setEditingAlertId] = useState<string | null>(null);

  const handleAddAlert = () => {
    dispatch(
      addAlert({
        drawingId,
        alert: {
          id: Date.now().toString(),
          drawingId,
          timeframe: "1",
          isEnabled: true,
          type: "priceAbove",
          muted: false,
        },
      })
    );
  };

  const handleDeleteAlert = (alertId: string) => {
    dispatch(deleteAlert({ drawingId, alertId }));
  };
  const handleAlertUpdate = (alertId: string, updates: Record<string, any>) => {
    dispatch(
      updateAlert({
        drawingId,
        alert: {
          id: alertId,
          ...updates,
        },
      })
    );
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="primary-hover"
          className="flex items-center gap-1 py-0.5 h-5 px-1.5 bg-red-500/10"
          size="sm"
        >
          Alert <BellIcon className="h-3 w-3" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-2" align="end">
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
            {alerts.map((alert: any) => (
              <div
                key={alert.id}
                className="flex items-center gap-2 p-1 rounded hover:bg-muted cursor-pointer"
                onClick={() => setEditingAlertId(alert.id)}
              >
                <div className="flex items-center gap-2 flex-1">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm" className="h-6 px-2">
                        {
                          alertTypeOptions.find(
                            (opt) => opt.value === alert.type
                          )?.label
                        }
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
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
                      <Button variant="outline" size="sm" className="h-6 px-2">
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
              </div>
            ))}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handleAddAlert}
            className="w-1/2 h-6 mt-4 mx-auto py-4"
          >
            Add Alert
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};
