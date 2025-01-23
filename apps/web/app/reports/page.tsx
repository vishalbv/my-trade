"use client";

import { Button } from "@repo/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@repo/ui/table";

import { useEffect, useState } from "react";

import { generateReport, getReports } from "../../src/store/actions/appActions";
import { Report } from "../../types/report";
import PLHeatmap from "../../src/components/PLHeatmap/PLHeatmap";

export default function ReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchReports = async () => {
    try {
      const data = await getReports({});

      setReports(data as Report[]);
    } catch (error) {
      console.error("Error fetching reports:", error);
    }
  };

  const handleGenerateReport = async () => {
    setLoading(true);
    try {
      await generateReport({});
      await fetchReports();
    } catch (error) {
      console.error("Error generating report:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  return (
    <div className="container mx-auto py-5 px-3 relative">
      <div className="flex justify-between items-center mb-6 absolute top-4 right-0">
        {/* <h1 className="text-2xl font-bold">Trading Reports</h1> */}
        <Button onClick={handleGenerateReport} disabled={loading}>
          {loading ? "Generating..." : "Generate Report"}
        </Button>
      </div>

      <div className="mb-10">
        <PLHeatmap reports={reports} />
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Available Margin</TableHead>
              <TableHead>Trades</TableHead>
              <TableHead>Brokerage</TableHead>
              <TableHead>P&L</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {reports.map((report) => (
              <TableRow key={report._id.$oid}>
                <TableCell>{report.id}</TableCell>
                <TableCell>
                  ₹{report.shoonya.fundInfo?.marginAvailable}
                </TableCell>
                <TableCell>
                  {report.shoonya.moneyManage.noOfTrades || 0}/
                  {report.shoonya.moneyManage.maxNoOfTrades || 0}
                </TableCell>
                <TableCell>₹{report.shoonya.fundInfo?.brokerage}</TableCell>
                <TableCell
                  className={`${Number(report.shoonya.fundInfo?.pl) >= 0 ? "text-green-600" : "text-red-600"}`}
                >
                  ₹{report.shoonya.fundInfo?.pl || 0}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
