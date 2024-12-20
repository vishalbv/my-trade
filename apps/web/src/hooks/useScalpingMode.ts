"use client";

import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../store/store";
import {
  updateChartLayout,
  setOptionChainData,
  setSelectedLayout,
  setScalpingMode,
} from "../store/slices/globalChartSlice";
import { findNearbyExpiries } from "../utils/helpers";
import { getOptionChain } from "../store/actions/appActions";
import { indexNamesTofyersIndexMapping } from "@repo/utils/helpers";
import { usePathname } from "next/navigation";
import { toggleLeftNav } from "../store/slices/webAppSlice";

export const useScalpingMode = (scalpingMode: boolean) => {
  const dispatch = useDispatch();
  const pathname = usePathname();
  const { upcomingExpiryDates } = useSelector(
    (state: RootState) => state.states.app
  );
  const { layouts } = useSelector((state: RootState) => state.globalChart);
  const mainLayout = layouts["1"] || {};
  const [initialsetup, setInitialsetup] = useState(false);

  // Handle navigation changes
  useEffect(() => {
    if (pathname !== "/global-chart") {
      dispatch(setScalpingMode(false));
    }
  }, [pathname]);

  useEffect(() => {
    if (scalpingMode) {
      dispatch(toggleLeftNav(true));
    } else {
      dispatch(toggleLeftNav(false));
      setInitialsetup(false);
    }
  }, [scalpingMode]);

  //   useEffect(() => {
  //     if (initialsetup) {
  //       setTimeout(() => {
  //         dispatch(toggleLeftNav(true));
  //       }, 100);
  //     }
  //   }, [initialsetup]);

  useEffect(() => {
    if (scalpingMode) {
      const setLayout = async () => {
        const nearbyExpiries = findNearbyExpiries(upcomingExpiryDates);

        if (nearbyExpiries?.[0]) {
          const [date, symbol] = nearbyExpiries[0];
          await fetchOptionDetails(indexNamesTofyersIndexMapping(symbol), date);

          dispatch(setSelectedLayout("horizontalThree"));
          setInitialsetup(true);
        }
      };
      setLayout();
    } else {
      setInitialsetup(false);
    }
  }, [scalpingMode, upcomingExpiryDates]);

  const fetchOptionDetails = async (symbol: string, expiryDate: string) => {
    if (!symbol) return;
    const strikecount = 8;
    const res =
      (await getOptionChain({
        symbol,
        broker: "fyers",
        strikecount,
      })) || {};

    const optionChainData = {
      symbol,
      expiry: res.expiryData || "",
      data: res.optionsChain || [],
    };

    // Store option chain data
    dispatch(setOptionChainData(optionChainData));

    // Filter CE and PE options
    const ceOptions =
      res?.optionsChain?.filter((opt) => opt.symbol.endsWith("CE")) || [];
    const peOptions =
      res?.optionsChain?.filter((opt) => opt.symbol.endsWith("PE")) || [];

    // Get middle options
    const middleCE = ceOptions[Math.floor(ceOptions.length / 2)];
    const middlePE = peOptions[Math.floor(peOptions.length / 2)];

    if (middleCE && middlePE) {
      dispatch(
        updateChartLayout({
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
  };

  useEffect(() => {
    if (scalpingMode && mainLayout.symbol && initialsetup) {
      const symbol = indexNamesTofyersIndexMapping(mainLayout.symbol, true);
      const expiryDate = mainLayout.symbol.endsWith("EQ")
        ? ""
        : upcomingExpiryDates[symbol][0].date;
      fetchOptionDetails(mainLayout.symbol, expiryDate);
    }
  }, [scalpingMode, mainLayout.symbol, initialsetup]);
};
