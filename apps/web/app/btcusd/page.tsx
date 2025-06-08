import dynamic from "next/dynamic";

const BTCScreen = dynamic(
  () => import("../../src/modules/BTCScreen/BTCScreen"),
  {
    ssr: false,
  }
);

export default function BTCUSDPage() {
  return <BTCScreen />;
}
