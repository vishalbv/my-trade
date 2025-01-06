"use client";
import { useDispatch, useSelector } from "react-redux";
import Clock from "../../components/clock";
import { RootState } from "../../store/store";
import { STYLES } from "../../utils/constants";
import Drawer from "../Drawers/drawer";
import { Button } from "@repo/ui/button";
import { Camera } from "lucide-react";
import { refreshScalpingMode } from "../../store/slices/globalChartSlice";
import { useCallback, useState } from "react";
import { getHistory, storeOptionHistory } from "../../store/actions/appActions";
import { calculateFromTimestamp } from "../../utils/helpers";

interface HistoryResponse {
  candles: number[][];
  s: string;
}

interface SymbolHistory {
  symbolData: any;
  data: number[][];
}

export const Footer = () => {
  const {
    [0]: ceMain,
    [1]: main,
    [2]: peMain,
  } = useSelector((state: RootState) => state.globalChart.optionsChartLayouts);
  const dispatch = useDispatch();
  const [isLoading, setIsLoading] = useState(false);

  const fetchHistoricalData = useCallback(
    async (symbolData: any): Promise<SymbolHistory | null> => {
      const fromTimestamp = calculateFromTimestamp("1");
      const toTimestamp = Math.floor(Date.now() / 1000);

      try {
        const response = (await getHistory({
          symbol: symbolData.symbol,
          resolution: "1",
          date_format: 0,
          range_from: fromTimestamp.toString(),
          range_to: toTimestamp.toString(),
          cont_flag: 1,
          broker: "fyers",
        })) as HistoryResponse;

        if (response?.candles && Array.isArray(response.candles)) {
          return {
            symbolData: symbolData,
            data: response.candles,
          };
        }
        return null;
      } catch (error) {
        console.error("Error fetching historical data:", error);
        return null;
      }
    },
    []
  );

  const _storeOptionHistory = async () => {
    if (isLoading) return;
    setIsLoading(true);
    dispatch(refreshScalpingMode());

    const store = async () => {
      try {
        const [ceHistory, mainHistory, peHistory] = await Promise.all([
          ceMain ? fetchHistoricalData(ceMain) : null,
          main ? fetchHistoricalData(main) : null,
          peMain ? fetchHistoricalData(peMain) : null,
        ]);

        const historyData = {
          ce: ceHistory,
          main: mainHistory,
          pe: peHistory,
        };

        // Here you can dispatch an action to store the history data

        storeOptionHistory(historyData);
      } catch (error) {
        console.error("Error collecting history:", error);
      } finally {
        setIsLoading(false);
      }
    };

    setTimeout(() => {
      store();
    }, 2000);
  };

  return (
    <div
      className="fixed bottom-0 z-[50] flex justify-between bg-nav w-fill"
      style={{ height: STYLES.footer.height }}
    >
      <div className="-mt-1 ml-2 flex items-center gap-2">
        <Clock simpleClock={true} />
        <Button
          onClick={_storeOptionHistory}
          variant="text"
          className="flex items-center gap-2 h-6 border-0 hover:border-0"
          disabled={isLoading}
        >
          <Camera className="h-4 w-4" />
          {isLoading ? "Capturing..." : "Capture"}
        </Button>
      </div>
      <Drawer />
    </div>
  );
};
