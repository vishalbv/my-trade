"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Button } from "@repo/ui/button";
import { Switch } from "@repo/ui/switch";
import { RefreshCw, ChevronLeft, ChevronRight, Copy } from "lucide-react";

import {
  BarChart2,
  BookOpen,
  LineChart,
  ShoppingCart,
  TrendingUp,
} from "lucide-react";
import { usePathname } from "next/navigation";
import { cn } from "../../../../../packages/ui/lib/utils";
import AppLogo from "../../components/appLogo";
import { STYLES } from "../../utils/constants";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@repo/ui/tooltip";

import { RootState } from "../../store/store";
import { useDispatch, useSelector } from "react-redux";
import { toggleLeftNav } from "../../store/slices/webAppSlice";
import { getLoginDetails, restartServer } from "../../store/actions/appActions";
import { sendMessage } from "../../services/webSocket";

const leftbraItems = [
  {
    label: "TRADE-MANAGE",
    href: "/trade-manage",
    icon: TrendingUp,
  },
  {
    label: "OPTION-BUY",
    href: "/option-buy",
    icon: ShoppingCart,
  },
  {
    label: "STOCKS-MANAGE",
    href: "/stocks-manage",
    icon: BarChart2,
  },
  {
    label: "REPORTS",
    href: "/reports",
    icon: BookOpen,
  },
  {
    label: "GLOBAL-CHART",
    href: "/global-chart",
    icon: LineChart,
  },
  {
    label: "BTCUSD",
    href: "/btcusd",
    icon: LineChart,
  },
];

const SidebarLabel: React.FC<{ children: React.ReactNode; show: boolean }> = ({
  children,
  show,
}) => (
  <span
    className={cn(
      "transition-all duration-300 origin-left",
      show ? "scale-100 opacity-100" : "scale-0 opacity-0 w-0 overflow-hidden"
    )}
  >
    {children}
  </span>
);

const Sidebar: React.FC = () => {
  const pathname = usePathname();
  const active = pathname?.split("/")[1] || "";
  const [showPWDTooltip, setShowPWDTooltip] = useState(false);
  const [showTOTPTooltip, setShowTOTPTooltip] = useState(false);
  const { testMode } = useSelector((state: RootState) => state.states.app);
  const isLeftNavCollapsed = useSelector(
    (state: RootState) => state.webApp.isLeftNavCollapsed
  );
  const dispatch = useDispatch();

  const handleCopy = (type: "password" | "otp") => {
    // Add your copy logic here
    // navigator.clipboard.writeText(value)

    getLoginDetails({ broker: "shoonya" }).then((data: any) => {
      console.log(data);
      navigator.clipboard.writeText(data[type]);
      if (type === "password") {
        setShowPWDTooltip(true);
        setTimeout(() => setShowPWDTooltip(false), 1000);
      } else {
        setShowTOTPTooltip(true);
        setTimeout(() => setShowTOTPTooltip(false), 1000);
      }
    });
  };

  const setAppState = (data: any) => {
    console.log("data", data);
    sendMessage("app", data);
  };

  return (
    <aside
      className={cn(
        "bg-nav text-nav-foreground flex flex-col transition-all duration-300 px-2",
        isLeftNavCollapsed ? "w-16" : "w-52"
      )}
      style={{ height: `calc(100vh - ${STYLES.footer.height})` }}
    >
      <div className="flex items-center justify-between h-14">
        <Link href="/home" className="flex items-center whitespace-nowrap">
          <AppLogo logo={!isLeftNavCollapsed ? true : false} />
        </Link>

        <Button
          variant="ghost"
          size="icon"
          onClick={() => dispatch(toggleLeftNav(!isLeftNavCollapsed))}
          className="text-nav-foreground/60 hover:text-nav-foreground hover:bg-nav-hover -mr-2"
        >
          {isLeftNavCollapsed ? (
            <ChevronRight size={20} />
          ) : (
            <ChevronLeft size={20} />
          )}
        </Button>
      </div>
      <nav className="flex-grow mt-2">
        <ul className="space-y-2">
          {leftbraItems.map((item) => (
            <li key={item.label}>
              <Link
                href={`${item.href}`}
                className={cn(
                  "flex items-center px-2 py-2 text-xs font-semibold transition-colors rounded-md whitespace-nowrap",
                  active === item.href.split("/")[1]
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-nav-hover hover:text-nav-foreground",
                  isLeftNavCollapsed && "justify-center"
                )}
                prefetch={true}
              >
                <item.icon
                  className={cn("w-5 h-5 mr-3", isLeftNavCollapsed && "mr-0")}
                />
                {/* {!isLeftNavCollapsed && item.label} */}
                <SidebarLabel show={!isLeftNavCollapsed}>
                  {item.label}
                </SidebarLabel>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      <div className="mt-auto space-y-4 pb-4 text-xs [&>div]:h-5">
        <div
          className={cn(
            "flex items-center transition-all duration-300",
            isLeftNavCollapsed ? "justify-center" : "justify-between"
          )}
        >
          <SidebarLabel show={!isLeftNavCollapsed}>SHOONYA</SidebarLabel>
          <div className="flex items-center gap-1">
            <TooltipProvider delayDuration={100}>
              <Tooltip open={isLeftNavCollapsed ? undefined : false}>
                <TooltipTrigger asChild>
                  <Button
                    variant="link"
                    size={isLeftNavCollapsed ? "icon" : "xs"}
                    className={cn(isLeftNavCollapsed && "h-5 w-5")}
                    onClick={() => handleCopy("password")}
                  >
                    <Copy
                      className={cn("w-2 h-2", isLeftNavCollapsed && "w-3 h-3")}
                    />
                    {!isLeftNavCollapsed && "PWD"}
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top">
                  <p>{isLeftNavCollapsed ? "Password" : "Copied!"}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider delayDuration={100}>
              <Tooltip open={isLeftNavCollapsed ? undefined : false}>
                <TooltipTrigger asChild>
                  <Button
                    variant="link"
                    size={isLeftNavCollapsed ? "icon" : "xs"}
                    className={cn(isLeftNavCollapsed && "h-5 w-5")}
                    onClick={() => handleCopy("otp")}
                  >
                    <Copy
                      className={cn("w-2 h-2", isLeftNavCollapsed && "w-3 h-3")}
                    />
                    {!isLeftNavCollapsed && "TOTP"}
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top">
                  <p>{isLeftNavCollapsed ? "TOTP" : "Copied!"}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>

        <div
          className={cn(
            "flex items-center transition-all duration-300",
            isLeftNavCollapsed ? "justify-center" : "justify-between"
          )}
        >
          <SidebarLabel show={!isLeftNavCollapsed}>
            DONE FOR THE DAY
          </SidebarLabel>
          <TooltipProvider delayDuration={100}>
            <Tooltip open={isLeftNavCollapsed ? undefined : false}>
              <TooltipTrigger asChild>
                <div>
                  <Switch className="scale-90" />
                </div>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p>Done for the day</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        <div
          className={cn(
            "flex items-center transition-all duration-300",
            isLeftNavCollapsed ? "justify-center" : "justify-between"
          )}
        >
          <SidebarLabel show={!isLeftNavCollapsed}>TEST MODE</SidebarLabel>
          <TooltipProvider delayDuration={100}>
            <Tooltip open={isLeftNavCollapsed ? undefined : false}>
              <TooltipTrigger asChild>
                <div>
                  <Switch
                    className="scale-90"
                    onCheckedChange={(value) =>
                      setAppState({ testMode: value })
                    }
                    checked={testMode}
                  />
                </div>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p>Test Mode</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        <div
          className={cn(
            "flex items-center transition-all duration-300",
            isLeftNavCollapsed ? "justify-center" : "justify-between"
          )}
        >
          <SidebarLabel show={!isLeftNavCollapsed}>
            REFRESH BACKEND
          </SidebarLabel>
          <TooltipProvider delayDuration={100}>
            <Tooltip open={isLeftNavCollapsed ? undefined : false}>
              <TooltipTrigger asChild>
                <Button
                  variant="primary-hover"
                  size="icon"
                  className="text-red-700 dark:text-orange-300 hover:!text-background"
                  onClick={() => restartServer({})}
                >
                  <RefreshCw
                    className={cn("h-4 w-4", isLeftNavCollapsed && "h-3 w-3")}
                  />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p>Refresh Backend</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
