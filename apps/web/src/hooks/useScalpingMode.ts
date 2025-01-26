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
import { searchSymbol } from "../store/actions/appActions";
import { INDEX_DETAILS } from "@repo/utils/constants";

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
  const ceMain = optionsChartLayouts["0"] || {};
  const [isInitializing, setIsInitializing] = useState(true);

  // // Handle navigation changes
  // useEffect(() => {
  //   if (pathname !== "/option-buy") {
  //     dispatch(setScalpingMode(false));
  //   }
  // }, [pathname]);

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

  const lastMainSymbol = useRef(null);

  useEffect(() => {
    const setLayout = async () => {
      const nearbyExpiries = findNearbyExpiries(upcomingExpiryDates);

      if (nearbyExpiries?.[0]) {
        const [date, symbol] = nearbyExpiries[0];

        await _fetchOptionDetails(indexNamesTofyersIndexMapping(symbol), date);

        setIsInitializing(false);
      }
    };
    setLayout();
  }, [JSON.stringify(upcomingExpiryDates), refreshScalpingMode]);

  const _fetchOptionDetails = async (symbol: string, expiryDate: string) => {
    if (!symbol) return;
    const mainSymbol = indexNamesTofyersIndexMapping(symbol, true);

    const { middleCE, middlePE, optionChainData } =
      (await fetchOptionDetails(symbol, expiryDate)) || {};
    // Store option chain data
    dispatch(setOptionChainData(optionChainData));
    const indexData = await searchSymbol({
      text:
        INDEX_DETAILS[mainSymbol as keyof typeof INDEX_DETAILS]
          ?.shoonyaSearchName +
        " " +
        middleCE.strike_price,
      exchange: mainLayout.symbol.startsWith("NSE") ? "NFO" : "BFO",
      broker: "shoonya",
    });

    const lotSize = Array.isArray(indexData) ? indexData[0]?.ls : undefined;

    if (middleCE && middlePE) {
      dispatch(
        updateChartLayout({
          layoutTypeKey: "optionsChartLayouts",
          "0": {
            symbol: middleCE.symbol,
            timeframe: "1",
            symbolInfo: { ...middleCE, expiryDate, lotSize },
          },
          "1": {
            symbol,
            timeframe: "1",
            symbolInfo: { symbol, expiryDate, lotSize },
            mainSymbol,
          },
          "2": {
            symbol: middlePE.symbol,
            timeframe: "1",
            symbolInfo: { ...middlePE, expiryDate, lotSize },
          },
        })
      );
      lastMainSymbol.current = symbol as any;
    }
    return null;
  };

  useEffect(() => {
    if (
      mainLayout.symbol &&
      lastMainSymbol.current &&
      !isInitializing &&
      lastMainSymbol.current !== mainLayout.symbol
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
