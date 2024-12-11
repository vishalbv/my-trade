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
    if (scalpingMode && pathname !== "/global-chart") {
      dispatch(setScalpingMode(false));
      setInitialsetup(false);
    }
  }, [pathname, scalpingMode, dispatch]);

  useEffect(() => {
    if (scalpingMode) {
      const setLayout = async () => {
        const nearbyExpiries = findNearbyExpiries(upcomingExpiryDates);

        if (nearbyExpiries?.[0]) {
          const [date, symbol] = nearbyExpiries[0];
          await fetchOptionDetails(indexNamesTofyersIndexMapping(symbol));

          dispatch(setSelectedLayout("horizontalThree"));
          setInitialsetup(true);
        }
      };
      setLayout();
    } else {
      setInitialsetup(false);
    }
  }, [scalpingMode, upcomingExpiryDates]);

  const fetchOptionDetails = async (symbol: string) => {
    if (!symbol) return;

    const res =
      (await getOptionChain({
        symbol,
        broker: "fyers",
        strikecount: 8,
      })) || {};

    const optionChainData = {
      symbol,
      expiry: res.expiry || "",
      data: res.optionsChain || [],
      atmStrike: res.atmStrike || 0,
    };

    // Store option chain data
    dispatch(setOptionChainData(optionChainData));

    const ceSymbol = res?.optionsChain?.[8]?.symbol;
    const peSymbol = res?.optionsChain?.[9]?.symbol;

    if (ceSymbol && peSymbol) {
      // Update CE and PE symbols

      dispatch(
        updateChartLayout({
          "0": { symbol: ceSymbol, timeframe: "1" },
          "1": {
            symbol,
            timeframe: "1",
          },
          "2": { symbol: peSymbol, timeframe: "1" },
        })
      );
    }
  };

  useEffect(() => {
    if (scalpingMode && mainLayout.symbol && initialsetup) {
      fetchOptionDetails(mainLayout.symbol);
    }
  }, [scalpingMode, mainLayout.symbol, initialsetup]);
};
