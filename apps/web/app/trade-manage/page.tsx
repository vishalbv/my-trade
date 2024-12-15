"use client";

import { Card } from "@repo/ui/card";
import { FundInfoDisplay } from "../../src/components/TradeManage/FundInfoDisplay";
import { TradeManageForm } from "../../src/components/TradeManage/TradeManageForm";
import { ActiveDot } from "../../src/components/activeDot";
import { useSelector } from "react-redux";

export default function TradeManage() {
  const { moneyManageInterval } = useSelector(
    (state: any) => state.states.shoonya || {}
  );
  return (
    <div className="container mx-auto p-4 space-y-6">
      <h1 className="text-3xl font-bold mb-6">Trade Management</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Fund Info Section */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Account Overview</h2>
          <FundInfoDisplay />
        </Card>

        {/* Trade Management Form */}
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold mb-4">Risk Parameters</h2>
            <ActiveDot status={moneyManageInterval} />
          </div>
          <TradeManageForm />
        </Card>
      </div>
    </div>
  );
}
