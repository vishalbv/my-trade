"use client";
import React, { useState, useEffect } from "react";
import { Bell, Menu, LogOut } from "lucide-react";
import { Button } from "@repo/ui/button";
import { ThemeSwitcher } from "../../components/ThemeSwitcher";
import { usePathname, useRouter } from "next/navigation";
import { sidebarIgnorePaths } from "../../utils/constants";
import { cn } from "@repo/utils/ui/helpers";
import { useTheme } from "next-themes";
import { logout } from "../../store/actions/appActions";

import { PnL } from "../../components/p&l";
import { PRICECOLOR } from "../../utils/helpers";
import { useSelector } from "react-redux";

import { RootState } from "../../store/store";
import { INDEX_DETAILS } from "@repo/utils/constants";

const logoutTimerDuration = 4;
const Header: React.FC = () => {
  const pathname = usePathname();
  const router = useRouter();

  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [timer, setTimer] = useState(logoutTimerDuration);
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null);
  const [mounted, setMounted] = useState(false);
  const { theme } = useTheme();
  const { fundInfo = {}, moneyManage = {} } = useSelector(
    ({ states }: RootState) => states.shoonya || {}
  );

  useEffect(() => {
    setMounted(true);
  }, []);

  const checkTimerAndLogout = async () => {
    if (isLoggingOut && timer > 0) {
      const id = setTimeout(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
      setTimeoutId(id as NodeJS.Timeout);
    }

    if (timer === 0) {
      await logout();
      setTimer(logoutTimerDuration);
      router.push("/");
      setTimeout(() => {
        setIsLoggingOut(false);
      }, 1000);
    }
  };

  useEffect(() => {
    checkTimerAndLogout();

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [isLoggingOut, timer, router]);

  const handleLogout = () => {
    setIsLoggingOut(true);
  };

  const cancelLogout = () => {
    setIsLoggingOut(false);
    setTimer(logoutTimerDuration);
    if (timeoutId) clearTimeout(timeoutId);
  };

  if (sidebarIgnorePaths.includes(pathname)) return null;

  const overlayStyle = mounted
    ? {
        background:
          theme === "dark"
            ? "linear-gradient(135deg, #000, #000)"
            : "linear-gradient(135deg, #fff, #fff)",
        clipPath: "polygon(100% 100%, 100% 100%, 100% 100%, 100% 100%)",
        transition: "opacity 0.3s ease",
      }
    : {};
  const indexToDisplay: (keyof typeof INDEX_DETAILS)[] = [
    "NIFTY-50",
    "FIN-NIFTY",
    "NIFTY-BANK",
  ];

  return (
    <>
      <header className="bg-nav text-nav-foreground p-2 flex justify-between items-center h-14">
        <div className="flex items-center">
          <PnL />
          <div className="text-center">
            <div className="text-xs text-foreground/60 mb-1">Margin left</div>
            <div className="text-foreground/90 text-sm">
              {fundInfo.marginAvailable}
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-4 text-sm gap-2">
          {indexToDisplay.map((index) => (
            <MarketIndex key={index} name={index} />
          ))}
        </div>

        <div className="flex items-center space-x-2">
          {/* <Button variant="ghost" size="icon">
            <Menu className="h-5 w-5" />
          </Button> */}
          <ThemeSwitcher />

          <Button variant="primary-hover" size="icon">
            <Bell className="h-5 w-5" />
          </Button>
          <Button variant="primary-hover" size="icon" onClick={handleLogout}>
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </header>

      {/* Logout Overlay */}
      <div
        className={cn(
          "fixed inset-0 z-50",
          isLoggingOut
            ? "animate-diagonal-slide-out opacity-100"
            : "opacity-0 pointer-events-none"
        )}
        style={overlayStyle}
      />

      {/* Cancel Button */}
      {isLoggingOut && (
        <div className="fixed inset-0 z-[51] flex items-center justify-center">
          <div className="text-center space-y-4 animate-fade-in">
            <div className="text-2xl font-bold">
              Logging out in {timer} seconds...
            </div>
            <Button
              variant="destructive"
              onClick={cancelLogout}
              className="animate-bounce"
            >
              Cancel Logout
            </Button>
          </div>
        </div>
      )}
    </>
  );
};

interface MarketIndexProps {
  name: keyof typeof INDEX_DETAILS;
}

export const MarketIndex = ({ name }: MarketIndexProps) => {
  const indexData = INDEX_DETAILS[name as keyof typeof INDEX_DETAILS];

  const price = useSelector(
    ({ ticks }: RootState) => ticks.shoonya_server[indexData.shoonyaToken] || {}
  );

  const change = price.lp - price.c;
  const percentageChange = price.pc;

  return (
    <div className="flex items-center gap-1">
      <span className="font-medium text-xs text-muted-foreground">{name}</span>
      <span className="mx-1">{price.lp}</span>

      <span className={cn("text-xs", PRICECOLOR(change))}>
        {change >= 0 ? "+" : ""}
        {change.toFixed(2)}
      </span>
      <span className={cn("text-xs", PRICECOLOR(Number(percentageChange)))}>
        ({percentageChange}%)
      </span>
    </div>
  );
};

export default Header;
