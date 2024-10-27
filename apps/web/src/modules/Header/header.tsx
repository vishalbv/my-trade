"use client";
import React from "react";
import Link from "next/link";

import { Bell, Menu } from "lucide-react";
import { Button } from "@repo/ui/button";
import { ThemeSwitcher } from "../../components/ThemeSwitcher";
import { usePathname } from "next/navigation";
import { sidebarIgnorePaths } from "../../utils/constants";

const Header: React.FC = () => {
  const pathname = usePathname();
  if (sidebarIgnorePaths.includes(pathname)) return null;
  return (
    <header className="bg-background text-foreground p-2 flex justify-between items-center h-12">
      <div className="flex items-center">
        <span className="text-primary">P&L 0.00%</span>
        <span className="ml-2 text-destructive">0.00%</span>
      </div>
      <div className="flex items-center space-x-2 text-sm">
        <div>Margin left 1644.40</div>
        <div>BANKEX 57971.49 (0.00%)</div>
        <div>FIN-NIFTY 23732.7 (0.00%)</div>
        <div>NIFTY-BANK 50787.45 (0.00%)</div>
        <div>NIFTY-50 24180.8 (0.00%)</div>
        <div>SENSEX 79402.29 (0.00%)</div>
      </div>
      <div className="flex items-center space-x-2">
        <Button variant="ghost" size="icon">
          <Menu className="h-5 w-5" />
        </Button>
        <Button variant="ghost" size="icon">
          <Bell className="h-5 w-5" />
        </Button>
        <ThemeSwitcher />
      </div>
    </header>
  );
};

export default Header;
