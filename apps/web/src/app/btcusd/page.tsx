import dynamic from "next/dynamic";

const BTCScreen = dynamic(() => import("../../modules/BTCScreen/BTCScreen"), {
  ssr: false,
});

export default function BTCUSDPage() {
  return <BTCScreen />;
}
