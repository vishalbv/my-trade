import React, { useState, useEffect } from "react";
import { Chart } from "../components/Chart";

interface OHLCData {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
}

const TradingPage: React.FC = () => {
  const [chartData, setChartData] = useState<OHLCData[]>([]);

  useEffect(() => {
    // Sample data - replace with your actual API call
    const sampleData: OHLCData[] = Array.from({ length: 100 }, (_, i) => ({
      timestamp: Date.now() - i * 24 * 60 * 60 * 1000,
      open: Math.random() * 1000 + 500,
      high: Math.random() * 1000 + 600,
      low: Math.random() * 1000 + 400,
      close: Math.random() * 1000 + 500,
    }));

    setChartData(sampleData);
  }, []);

  return (
    <div style={{ width: "100%", height: "600px" }}>
      <Chart data={chartData} />
    </div>
  );
};

export default TradingPage;
