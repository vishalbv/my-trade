import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@repo/ui/dialog";
import { Input } from "@repo/ui/input";
import {
  getOptionChain,
  searchSymbol,
} from "../../../store/actions/appActions";
import { INDEX_DETAILS } from "@repo/utils/constants";
import { indexNamesTofyersIndexMapping } from "@repo/utils/helpers";

interface SymbolSearchProps {
  isOpen: boolean;
  onClose: () => void;
  onSymbolSelect: (symbol: { name: string; type: string }) => void; // Update this line
}

const INDICES = [
  { symbol: "NSE:NIFTY50-INDEX", description: "NIFTY 50" },
  { symbol: "NSE:NIFTYBANK-INDEX", description: "BANK NIFTY" },
  { symbol: "NSE:FINNIFTY-INDEX", description: "FIN NIFTY" },
  { symbol: "NSE:MIDCPNIFTY-INDEX", description: "MIDCAP NIFTY" },
];

const chipStyles = {
  base: "px-4 py-0.5 rounded-full cursor-pointer text-sm font-medium h-6",
  active: "bg-primary text-primary-foreground",
  inactive: "bg-muted hover:bg-muted/80",
};

const symbolTypes = [
  { id: "stocks", label: "Stocks", exchange: "NSE" },
  { id: "options", label: "Options", exchange: "BFO" },
] as const;

const OptionChainItem = ({
  option,
  onSelect,
  index,
}: {
  option: any;
  onSelect: (option: any) => void;
  index: number;
}) => (
  <div
    key={option.fyToken}
    className={`px-4 py-1 hover:bg-muted cursor-pointer rounded-md mb-2 ${
      index == 4 ? "bg-destructive/10" : ""
    }`}
    onClick={() => onSelect(option)}
  >
    <div className="flex justify-between items-center">
      <span className="font-medium text-sm">
        {option.strike_price} {option.option_type}
      </span>
      <span className="text-sm text-primary">@ {option.ltp}</span>
    </div>
    <div className="text-2xs text-muted-foreground">{option.symbol}</div>
  </div>
);

export const SymbolSearch = ({
  isOpen,
  onClose,
  onSymbolSelect,
}: SymbolSearchProps) => {
  const [searchTerm, setSearchTerm] = useState({
    text: "",
    optionChainSymbol: "",
    selectedType: "stocks",
  });
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [optionChainResults, setOptionChainResults] = useState<any>({});

  const handleTypeChange = (type: (typeof symbolTypes)[number]["id"]) => {
    setSearchTerm({
      ...searchTerm,
      selectedType: type,
    });
    setSearchResults([]);
  };

  const fetchSearchResults = async (exchange: string, text: string) => {
    try {
      const response = (await searchSymbol({
        exchange,
        text,
        broker: "shoonya",
      })) as any;

      if (response && Array.isArray(response)) {
        return response;
      }
      return null;
    } catch (error) {
      console.error("Error fetching historical data:", error);
      return null;
    }
  };

  useEffect(() => {
    let intervalId: any;

    const fetchOptionChain = async () => {
      try {
        const res = await getOptionChain({
          symbol: indexNamesTofyersIndexMapping(searchTerm.optionChainSymbol),
          broker: "fyers",
        });
        setOptionChainResults(res || []);
      } catch (error) {
        console.error("Error fetching option chain:", error);
      }
    };

    if (searchTerm.optionChainSymbol) {
      setSearchResults([]);
      setSearchTerm({
        ...searchTerm,
        selectedType: "stocks",
        text: "",
      });

      // Initial fetch
      fetchOptionChain();

      // Set up interval for subsequent fetches
      intervalId = setInterval(fetchOptionChain, 2000);
    }

    // Cleanup interval when component unmounts or optionChainSymbol changes
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [searchTerm.optionChainSymbol]);

  useEffect(() => {
    setOptionChainResults([]);
    setSearchTerm({
      ...searchTerm,
      optionChainSymbol: "",
    });
    if (searchTerm.text.length > 2) {
      if (searchTerm.selectedType === "stocks") {
        fetchSearchResults("NSE", searchTerm.text).then((res) => {
          setSearchResults(res || []);
        });
      } else if (searchTerm.selectedType === "options") {
        // Fetch from both NFO and BFO exchanges for options
        Promise.all([
          fetchSearchResults("NFO", searchTerm.text),
          fetchSearchResults("BFO", searchTerm.text),
        ])
          .then(([nfoResults, bfoResults]) => {
            const mergedResults = [
              ...(nfoResults || []),
              ...(bfoResults || []),
            ];
            setSearchResults(mergedResults);
          })
          .catch((error) => {
            console.error("Error fetching options data:", error);
            setSearchResults([]);
          });
      }
    } else {
      setSearchResults([]);
    }
  }, [searchTerm.text, searchTerm.selectedType]);

  const _onSymbolSelect = (option: any) =>
    onSymbolSelect({
      ...option,
      expiryDate: optionChainResults.expiryData[0].date,
    });

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[650px] h-[640px] flex flex-col">
        <DialogHeader className="flex gap-12 flex-row items-center">
          <DialogTitle>Symbol Search</DialogTitle>
          <div className="flex gap-2 mb-4">
            {symbolTypes.map((type) => (
              <button
                key={type.id}
                className={`${chipStyles.base} ${
                  searchTerm.selectedType === type.id
                    ? chipStyles.active
                    : chipStyles.inactive
                }`}
                onClick={() => handleTypeChange(type.id)}
              >
                {type.label}
              </button>
            ))}
          </div>
        </DialogHeader>

        <div>
          <Input
            value={searchTerm.text}
            onChange={(e) =>
              setSearchTerm({ ...searchTerm, text: e.target.value })
            }
            placeholder={`Search ${searchTerm.selectedType}...`}
            className="my-4"
            autoFocus
            onFocus={(e) => e.target.select()}
          />
          <div>
            <div className="flex gap-2 mb-4">
              {Object.keys(INDEX_DETAILS).map((index) => (
                <button
                  key={index}
                  className={`${chipStyles.base} ${
                    searchTerm.optionChainSymbol === index
                      ? chipStyles.active
                      : chipStyles.inactive
                  }`}
                  onDoubleClick={() => {
                    const symbol = { name: index, type: "index" };
                    onSymbolSelect(symbol);
                  }}
                  onClick={() => {
                    setSearchTerm({
                      ...searchTerm,
                      optionChainSymbol: index,
                    });
                  }}
                >
                  {index}
                </button>
              ))}
            </div>

            <div className="flex">
              <div className="w-1/2 pr-2">
                {optionChainResults?.optionsChain
                  ?.filter((option: any) => option.option_type === "CE")
                  .sort((a: any, b: any) => b.strike_price - a.strike_price)
                  .map((option: any, index: number) => (
                    <OptionChainItem
                      key={option.fyToken}
                      option={option}
                      onSelect={_onSymbolSelect}
                      index={index}
                    />
                  ))}
              </div>
              <div className="w-1/2 pl-2">
                {optionChainResults?.optionsChain
                  ?.filter(
                    (option: any, index: number) => option.option_type === "PE"
                  )
                  .map((option: any, index: number) => (
                    <OptionChainItem
                      key={option.fyToken}
                      option={option}
                      onSelect={_onSymbolSelect}
                      index={index}
                    />
                  ))}
              </div>
            </div>
            <div className="overflow-y-auto h-[450px]">
              {searchResults.map((symbol) => (
                <div
                  key={symbol.token}
                  className="px-2 py-1 hover:bg-muted cursor-pointer flex justify-between items-center rounded-md mb-2"
                  onClick={() => {
                    onSymbolSelect(symbol);
                  }}
                >
                  <div>
                    <div className="font-medium text-sm mb-1">
                      {symbol.cname || symbol.dname}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {symbol.tsym}
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {symbol.exch}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
