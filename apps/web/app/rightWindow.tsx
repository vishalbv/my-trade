"use client";
import { useSelector } from "react-redux";
import { RootState } from "../src/store/store";

import { OptionsAnalyzerWindow } from "../src/modules/Header/OptionsAnalyzerWindow";

export const RightWindow = () => {
  const { showPositionsOrders, showOptionsAnalyzer } = useSelector(
    (state: RootState) => state.webApp
  );
  return <>{showOptionsAnalyzer && <OptionsAnalyzerWindow />}</>;
};
