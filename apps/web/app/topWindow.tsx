"use client";
import { useSelector } from "react-redux";
import { RootState } from "../src/store/store";

import { OptionsAnalyzerWindow } from "../src/modules/Header/OptionsAnalyzerWindow";
import { PositionsAndOrders } from "../src/modules/Header/postionsAndOrders/postionsAndOrders";

export const TopWindow = () => {
  const { showPositionsOrders, showOptionsAnalyzer } = useSelector(
    (state: RootState) => state.webApp
  );
  return <>{showPositionsOrders && <PositionsAndOrders />}</>;
};
