import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@repo/ui/dialog";
import { Input } from "@repo/ui/input";

interface SymbolSearchProps {
  isOpen: boolean;
  onClose: () => void;
  onSymbolSelect: (symbol: string) => void;
}

const INDICES = [
  { symbol: "NSE:NIFTY50-INDEX", description: "NIFTY 50" },
  { symbol: "NSE:NIFTYBANK-INDEX", description: "BANK NIFTY" },
  { symbol: "NSE:FINNIFTY-INDEX", description: "FIN NIFTY" },
  { symbol: "NSE:MIDCPNIFTY-INDEX", description: "MIDCAP NIFTY" },
];

export const SymbolSearch = ({
  isOpen,
  onClose,
  onSymbolSelect,
}: SymbolSearchProps) => {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredIndices = INDICES.filter(
    (index) =>
      index.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
      index.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Symbol Search</DialogTitle>
        </DialogHeader>
        <Input
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search indices..."
          className="my-4"
          autoFocus
        />
        <div className="max-h-[400px] overflow-y-auto">
          {filteredIndices.map((index) => (
            <div
              key={index.symbol}
              className="px-4 py-3 hover:bg-muted cursor-pointer flex justify-between items-center rounded-md"
              onClick={() => {
                onSymbolSelect(index.symbol);
                onClose();
              }}
            >
              <div>
                <div className="font-medium">{index.description}</div>
                <div className="text-sm text-muted-foreground">
                  {index.symbol}
                </div>
              </div>
              <div className="text-xs text-muted-foreground">NSE</div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};
