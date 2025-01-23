import { getOptionChain } from "./appActions";

export const fetchOptionDetails = async (
  symbol: string,
  expiryDate: string
): Promise<{
  middleCE: any;
  middlePE: any;
  symbol: string;
  optionChainData: any;
  expiryDate: string;
} | null> => {
  if (!symbol) return null;
  const strikecount = 8;
  const res =
    (await getOptionChain({
      symbol,
      broker: "fyers",
      strikecount,
    })) || ({} as any);

  const optionChainData = {
    symbol,
    expiry: res.expiryData || "",
    data: res.optionsChain || [],
  };

  // Store option chain data
  //   dispatch(setOptionChainData(optionChainData));

  // Filter CE and PE options
  const ceOptions =
    res?.optionsChain?.filter((opt: any) => opt.symbol.endsWith("CE")) || [];
  const peOptions =
    res?.optionsChain?.filter((opt: any) => opt.symbol.endsWith("PE")) || [];

  // Get middle options
  const middleCE = ceOptions[Math.floor(ceOptions.length / 2)];
  const middlePE = peOptions[Math.floor(peOptions.length / 2)];

  return { middleCE, middlePE, symbol, optionChainData, expiryDate };
};
