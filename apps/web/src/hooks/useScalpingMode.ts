"use client";

import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../store/store";
import {
  updateChartLayout,
  setOptionChainData,
  setSelectedLayout,
} from "../store/slices/globalChartSlice";
import { findNearbyExpiries } from "../utils/helpers";
import { indexNamesTofyersIndexMapping } from "@repo/utils/helpers";
import { usePathname } from "next/navigation";
import { setRightWindowSize, toggleLeftNav } from "../store/slices/webAppSlice";
import { fetchOptionDetails } from "../store/actions/helperActions";

export const useScalpingMode = () => {
  const dispatch = useDispatch();
  const pathname = usePathname();
  const { upcomingExpiryDates = {} } = useSelector(
    (state: RootState) => state.states.app
  );
  const { optionsChartLayouts, refreshScalpingMode } = useSelector(
    (state: RootState) => state.globalChart
  );
  const mainLayout = optionsChartLayouts["1"] || {};
  const [isInitializing, setIsInitializing] = useState(true);

  // // Handle navigation changes
  // useEffect(() => {
  //   if (pathname !== "/option-buy") {
  //     dispatch(setScalpingMode(false));
  //   }
  // }, [pathname]);

  console.log("scalpingMode", isInitializing);

  useEffect(() => {
    dispatch(toggleLeftNav(true));
    dispatch(setRightWindowSize(30));

    return () => {
      setIsInitializing(false);
      setTimeout(() => {
        dispatch(toggleLeftNav(false));
        dispatch(setRightWindowSize(0));
      }, 500);
    };
  }, []);

  //   useEffect(() => {
  //     if (initialsetup) {
  //       setTimeout(() => {
  //         dispatch(toggleLeftNav(true));
  //       }, 100);
  //     }
  //   }, [initialsetup]);

  const lastRefreshTime = useRef(null);

  useEffect(() => {
    const setLayout = async () => {
      const nearbyExpiries = findNearbyExpiries(upcomingExpiryDates);
      console.log("nearbyExpiries-----", nearbyExpiries);
      if (nearbyExpiries?.[0]) {
        const [date, symbol] = nearbyExpiries[0];

        await _fetchOptionDetails(indexNamesTofyersIndexMapping(symbol), date);

        // dispatch(setSelectedLayout("horizontalThree"));
        setTimeout(() => {
          setIsInitializing(false);
          lastRefreshTime.current = refreshScalpingMode;
        }, 200);
      }
    };
    setLayout();
  }, [JSON.stringify(upcomingExpiryDates), refreshScalpingMode]);

  const _fetchOptionDetails = async (symbol: string, expiryDate: string) => {
    if (!symbol) return;
    const { middleCE, middlePE, optionChainData } =
      (await fetchOptionDetails(symbol, expiryDate)) || {};
    // Store option chain data
    dispatch(setOptionChainData(optionChainData));

    if (middleCE && middlePE) {
      dispatch(
        updateChartLayout({
          layoutTypeKey: "optionsChartLayouts",
          "0": {
            symbol: middleCE.symbol,
            timeframe: "1",
            symbolInfo: { ...middleCE, expiryDate },
          },
          "1": {
            symbol,
            timeframe: "1",
            symbolInfo: { symbol, expiryDate },
          },
          "2": {
            symbol: middlePE.symbol,
            timeframe: "1",
            symbolInfo: { ...middlePE, expiryDate },
          },
        })
      );
    }
    return null;
  };

  useEffect(() => {
    if (
      mainLayout.symbol &&
      !isInitializing &&
      lastRefreshTime.current == refreshScalpingMode
    ) {
      const symbol = indexNamesTofyersIndexMapping(mainLayout.symbol, true);
      const expiryDate = mainLayout.symbol.endsWith("EQ")
        ? ""
        : upcomingExpiryDates[symbol][0].date;
      _fetchOptionDetails(mainLayout.symbol, expiryDate);
    }
  }, [mainLayout.symbol, isInitializing]);

  return {
    mainLayout,
    isInitializing: isInitializing,
  };
};
