"use client";

import dynamic from "next/dynamic";

const OptionGlobalChart = dynamic(
  () => import("../../src/components/GlobalChart/optionGlobalChart"),
  {
    ssr: false,
  }
);

export default function OptionBuyPage() {
  return <OptionGlobalChart />;
}
