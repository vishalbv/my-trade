"use client";

import dynamic from "next/dynamic";

const GlobalChart = dynamic(
  () => import("../../components/GlobalChart/globalChartdelta"),
  {
    ssr: false,
  }
);

export default function GlobalChartPage() {
  return <GlobalChart />;
}
