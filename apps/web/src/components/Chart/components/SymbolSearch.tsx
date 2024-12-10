import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@repo/ui/dialog";
import { Input } from "@repo/ui/input";
import { searchSymbol } from "../../../store/actions/appActions";
import { INDEX_DETAILS } from "@repo/utils/constants";

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

export const SymbolSearch = ({
  isOpen,
  onClose,
  onSymbolSelect,
}: SymbolSearchProps) => {
  const [searchTerm, setSearchTerm] = useState({
    text: "",
  });
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedType, setSelectedType] =
    useState<(typeof symbolTypes)[number]["id"]>("stocks");

  const handleTypeChange = (type: (typeof symbolTypes)[number]["id"]) => {
    setSelectedType(type);
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
    if (searchTerm.text.length > 2) {
      if (selectedType === "stocks") {
        fetchSearchResults("NSE", searchTerm.text).then((res) => {
          setSearchResults(res || []);
        });
      } else if (selectedType === "options") {
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
  }, [searchTerm, selectedType]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Symbol Search</DialogTitle>
        </DialogHeader>

        <Input
          value={searchTerm.text}
          onChange={(e) =>
            setSearchTerm({ ...searchTerm, text: e.target.value })
          }
          placeholder={`Search ${selectedType}...`}
          className="my-4"
          autoFocus
          onFocus={(e) => e.target.select()}
        />
        <div className="max-h-[400px] overflow-y-auto">
          <div className="flex gap-2 mb-4">
            {Object.keys(INDEX_DETAILS).map((index) => (
              <button
                key={index}
                className={`${chipStyles.base} ${chipStyles.inactive}`}
                onClick={() => {
                  const symbol = { name: index, type: "index" };
                  onSymbolSelect(symbol);
                }}
              >
                {index}
              </button>
            ))}
          </div>

          <div className="flex gap-2 mb-4">
            {symbolTypes.map((type) => (
              <button
                key={type.id}
                className={`${chipStyles.base} ${
                  selectedType === type.id
                    ? chipStyles.active
                    : chipStyles.inactive
                }`}
                onClick={() => handleTypeChange(type.id)}
              >
                {type.label}
              </button>
            ))}
          </div>
          {searchResults.map((symbol) => (
            <div
              key={symbol.token}
              className="px-4 py-3 hover:bg-muted cursor-pointer flex justify-between items-center rounded-md"
              onClick={() => {
                onSymbolSelect(symbol);
              }}
            >
              <div>
                <div className="font-medium">{symbol.tsym}</div>
                <div className="text-sm text-muted-foreground">
                  {symbol.cname || symbol.dname}
                </div>
              </div>
              <div className="text-xs text-muted-foreground">{symbol.exch}</div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};
