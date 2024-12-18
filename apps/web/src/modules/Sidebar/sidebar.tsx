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
import { sidebarIgnorePaths } from "../../utils/constants";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@repo/ui/tooltip";
import Clock from "../../components/clock";

const leftbraItems = [
  {
    label: "MONEY-MANAGE",
    href: "/money-manage",
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
];

const Sidebar: React.FC = () => {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const active = pathname?.split("/")[1] || "";
  const [showPWDTooltip, setShowPWDTooltip] = useState(false);
  const [showTOTPTooltip, setShowTOTPTooltip] = useState(false);

  const handleCopy = (type: "PWD" | "TOTP") => {
    // Add your copy logic here
    // navigator.clipboard.writeText(value)

    if (type === "PWD") {
      setShowPWDTooltip(true);
      setTimeout(() => setShowPWDTooltip(false), 1000);
    } else {
      setShowTOTPTooltip(true);
      setTimeout(() => setShowTOTPTooltip(false), 1000);
    }
  };

  if (sidebarIgnorePaths.includes(pathname)) return null;

  return (
    <aside
      className={cn(
        "bg-nav text-nav-foreground min-h-screen flex flex-col transition-all duration-300 px-2",
        isCollapsed ? "w-16" : "w-52"
      )}
    >
      <div className="flex items-center justify-between h-14">
        <Link href="/home" className="flex items-center whitespace-nowrap">
          <AppLogo logo={!isCollapsed ? true : false} />
        </Link>

        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="text-nav-foreground/60 hover:text-nav-foreground hover:bg-nav-hover -mr-2"
        >
          {isCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
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
                  isCollapsed && "justify-center"
                )}
                prefetch={true}
              >
                <item.icon
                  className={cn("w-5 h-5 mr-3", isCollapsed && "mr-0")}
                />
                {!isCollapsed && item.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      {!isCollapsed && (
        <div className="mt-auto space-y-4 pb-4 text-xs [&>div]:h-5">
          <div className="flex items-center justify-between">
            <span>SHOONYA</span>
            <div className="flex items-center">
              <TooltipProvider>
                <Tooltip open={showPWDTooltip}>
                  <TooltipTrigger asChild>
                    <Button
                      variant="link"
                      size="xs"
                      onClick={() => handleCopy("PWD")}
                    >
                      <Copy className="w-2 h-2" />
                      PWD
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="top" align="center">
                    <p>Copied!</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip open={showTOTPTooltip}>
                  <TooltipTrigger asChild>
                    <Button
                      variant="link"
                      size="xs"
                      onClick={() => handleCopy("TOTP")}
                    >
                      <Copy className="w-2 h-2" />
                      TOTP
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="top" align="center">
                    <p>Copied!</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span>DONE FOR THE DAY</span>
            <Switch className="scale-90" />
          </div>
          <div className="flex items-center justify-between">
            <span>TEST MODE</span>
            <Switch className="scale-90" />
          </div>
          <div className="flex items-center justify-between">
            <span>REFRESH BACKEND</span>
            <Button
              variant="primary-hover"
              size="icon"
              className="text-red-700 dark:text-orange-300 hover:!text-background"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
          <Clock simpleClock={true} />
        </div>
      )}
    </aside>
  );
};

export default Sidebar;
