"use client";

import dynamic from "next/dynamic";

const GlobalChart = dynamic(
  () => import("../../src/components/GlobalChart/globalChart"),
  {
    ssr: false,
  }
);

export default function GlobalChartPage() {
  return <GlobalChart />;
}
