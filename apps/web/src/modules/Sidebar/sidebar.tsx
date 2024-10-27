"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Button } from "@repo/ui/button";
import { Switch } from "@repo/ui/switch";
import { RefreshCw, ChevronLeft, ChevronRight } from "lucide-react";
import AppIcon from "../../../icons/appIcon";
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
];

const Sidebar: React.FC = () => {
  const pathname = usePathname();

  if (sidebarIgnorePaths.includes(pathname)) return null;
  const active = pathname?.split("/")[1] || "";
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        "bg-nav text-nav-foreground min-h-screen flex flex-col transition-all duration-300 px-2",
        isCollapsed ? "w-16" : "w-52"
      )}
    >
      <div className="flex items-center justify-between h-16 ">
        {!isCollapsed && (
          <Link href="/" className="flex items-center whitespace-nowrap">
            <AppLogo />
          </Link>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="text-nav-foreground/60 hover:text-nav-foreground hover:bg-nav-hover"
        >
          {isCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
        </Button>
      </div>
      <nav className="flex-grow mt-4">
        <ul className="space-y-2">
          {leftbraItems.map((item) => (
            <li key={item.label}>
              <Link
                href={`${item.href}`}
                className={cn(
                  "flex items-center px-2 py-2 text-sm font-medium transition-colors rounded-md whitespace-nowrap",
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
        <div className="mt-auto space-y-4 p-4">
          <div className="flex items-center justify-between">
            <span>SHOONYA</span>
            <div className="space-x-2">
              <Button variant="outline" size="sm">
                PWD
              </Button>
              <Button variant="outline" size="sm">
                TOTP
              </Button>
            </div>
          </div>
          <Button variant="outline" className="w-full" size="sm">
            <RefreshCw className="mr-2 h-4 w-4" />
            REFRESH BACKEND
          </Button>
          <div className="flex items-center justify-between">
            <span>DONE FOR THE DAY</span>
            <Switch />
          </div>
          <div className="flex items-center justify-between">
            <span>TEST MODE</span>
            <Switch />
          </div>
        </div>
      )}
    </aside>
  );
};

export default Sidebar;
