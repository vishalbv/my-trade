import { useState, useRef } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@repo/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@repo/ui/popover";
import { Button } from "@repo/ui/button";
import { BellIcon, BellOffIcon } from "lucide-react";

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

export const AlertBuySellWindow = ({
  symbol,
  drawingId,
  onClose,
}: AlertBuySellWindowProps) => {
  const [selectedTimeframe, setSelectedTimeframe] = useState<
    (typeof timeframeOptions)[0]
  >(timeframeOptions[0]);
  const [isAlertEnabled, setIsAlertEnabled] = useState(true);

  const handleTimeframeSelect = (timeframe: (typeof timeframeOptions)[0]) => {
    setSelectedTimeframe(timeframe);
  };

  const toggleAlert = () => {
    setIsAlertEnabled(!isAlertEnabled);
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="primary-hover"
          className="flex items-center gap-2 py-1 h-6 px-2 bg-red-500/10"
          size="sm"
        >
          Alert <BellIcon className="h-3 w-3" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-4" align="end">
        <div className="flex flex-col space-y-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Alert Settings</span>
              <span className="text-xs text-muted-foreground">
                {selectedTimeframe.label}
              </span>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              ✕
            </Button>
          </div>

          <div>
            <label className="text-sm text-muted-foreground">Timeframe</label>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-between mt-1"
                >
                  {selectedTimeframe.label}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-[200px]">
                {timeframeOptions.map((option) => (
                  <DropdownMenuItem
                    key={option.value}
                    onClick={() => handleTimeframeSelect(option)}
                  >
                    {option.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Enable Alert</span>
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleAlert}
              className={
                isAlertEnabled ? "text-primary" : "text-muted-foreground"
              }
            >
              {isAlertEnabled ? (
                <BellIcon className="h-4 w-4" />
              ) : (
                <BellOffIcon className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};
