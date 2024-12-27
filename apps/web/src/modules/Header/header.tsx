"use client";
import React, { useState, useEffect, useCallback } from "react";
import { Bell, Menu, LogOut, Zap, RefreshCcw } from "lucide-react";
import { Button } from "@repo/ui/button";
import { ThemeSwitcher } from "../../components/ThemeSwitcher";
import { usePathname, useRouter } from "next/navigation";
import { sidebarIgnorePaths, STYLES } from "../../utils/constants";
import { cn } from "@repo/utils/ui/helpers";
import { useTheme } from "next-themes";
import { logout } from "../../store/actions/appActions";
import { useDispatch, useSelector } from "react-redux";
import { refreshScalpingMode } from "../../store/slices/globalChartSlice";

import { PnL } from "../../components/p&l";
import { PRICECOLOR } from "../../utils/helpers";
import { RootState } from "../../store/store";
import { INDEX_DETAILS } from "@repo/utils/constants";

import { getRandomQuote } from "../../utils/tradingQuotes";

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

  const dispatch = useDispatch();

  const [currentQuote, setCurrentQuote] = useState(() => getRandomQuote());

  useEffect(() => {
    if (pathname === "/home") {
      const interval = setInterval(() => {
        setCurrentQuote(getRandomQuote());
      }, 60000); // Change quote every minute
      return () => clearInterval(interval);
    }
  }, [pathname]);

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
  const scalpingMode = pathname === "/option-buy";

  const handleScalpingMode = () => {
    if (!scalpingMode) {
      router.push("/option-buy");
    } else {
      dispatch(refreshScalpingMode());
    }
  };

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
      <header className="bg-nav text-nav-foreground">
        <div
          className="flex justify-between items-center p-2"
          style={{ height: STYLES.header.height }}
        >
          {pathname !== "/home" ? (
            <>
              {" "}
              <div className="flex items-center">
                <PnL />
                <div className="text-center">
                  <div className="text-xs text-foreground/60 mb-1">
                    Margin left
                  </div>
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
            </>
          ) : (
            <div className="flex items-center justify-center flex-1 ml-32">
              <div className="text-center max-w-2xl">
                <p>
                  <span className="text-sm text-muted-foreground italic">
                    "{currentQuote.quote}"
                  </span>
                  <span className="text-xs text-muted-foreground mt-1 ml-2">
                    — {currentQuote.author}
                  </span>
                </p>
              </div>
            </div>
          )}

          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              onClick={handleScalpingMode}
              className={cn(
                "rounded-full bg-nav px-2 pr-3 py-0 h-8 flex items-center gap-2 hover:bg-pimary/80 hover:text-foreground/80 text-muted-foreground animate-click scale-95 hover:scale-100 transition-all duration-100",
                scalpingMode &&
                  "dark:!text-yellow-500 !text-yellow-800 border-yellow-00/50 dark:border-yellow-500/50"
              )}
            >
              <Zap className="h-5 w-5" />
              <span className="mb-1">
                {scalpingMode ? "Refresh" : "scalper"}
              </span>
              {scalpingMode && <RefreshCcw className="h-5 w-5" />}
            </Button>
            <ThemeSwitcher />

            <Button variant="primary-hover" size="icon">
              <Bell className="h-5 w-5" />
            </Button>
            <Button variant="primary-hover" size="icon" onClick={handleLogout}>
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Logout Overlay */}
      <div
        className={cn(
          "fixed inset-0 z-[998]",
          isLoggingOut
            ? "animate-diagonal-slide-out opacity-100"
            : "opacity-0 pointer-events-none"
        )}
        style={overlayStyle}
      />

      {/* Cancel Button */}
      {isLoggingOut && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center">
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

  // const change = price.lp - price.c;
  const percentageChange = price.pc;

  return (
    <div className="flex items-center gap-1">
      <span className="font-medium text-xs text-muted-foreground">{name}</span>
      <span className="mx-1">{price.lp}</span>

      {/* <span className={cn("text-xs", PRICECOLOR(change))}>
        {change >= 0 ? "+" : ""}
        {change.toFixed(2)}
      </span> */}
      <span className={cn("text-xs", PRICECOLOR(Number(percentageChange)))}>
        ({percentageChange}%)
      </span>
    </div>
  );
};

export default Header;
