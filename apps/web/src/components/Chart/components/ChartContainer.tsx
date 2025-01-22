import { useState, useEffect, useRef, useCallback, memo, useMemo } from "react";
import CanvasChart from "../CanvasChart";
import { useRealtimeCandles } from "../hooks/useRealtimeCandles";
import { Button } from "@repo/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@repo/ui/dropdown-menu";
import { Separator } from "@repo/ui/separator";
import { cn } from "@repo/utils/ui/helpers";
import { TimeframeConfig, Drawing } from "../types";
import { SymbolSearch } from "./SymbolSearch";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../../../store/store";
import {
  initializeLayout,
  updateLayoutSymbol,
  updateLayoutTimeframe,
  setSelectedChartKey,
  setChartFullScreenId,
  setSelectedDrawing,
  LayoutKeyType,
  setChartHistoryForOptions,
} from "../../../store/slices/globalChartSlice";
import { DEFAULT_CHART_LAYOUT } from "../../../utils/constants";
import {
  fetchShoonyaNameByFyersSymbol,
  getCurrentShoonyaPositionPL,
  shoonyaToFyersSymbol,
} from "@repo/utils/helpers";

import { updateFyersToShoonyaMapping } from "../../../store/actions/symbolsActions";
import { AlertBuySellWindow } from "./AlertBuySellWindow";
import {
  addDrawing,
  updateDrawing,
} from "../../../store/actions/drawingActions";

import { Popover, PopoverContent, PopoverTrigger } from "@repo/ui/popover";
import { INDEX_DETAILS } from "@repo/utils/constants";
import { PRICECOLOR } from "../../../utils/helpers";

interface Indicator {
  id: string;
  label: string;
  enabled: boolean;
}

interface ChartContainerProps {
  layoutTypeKey: LayoutKeyType;
  timeframeConfigs: { [key: string]: TimeframeConfig };
  chartKey: string;
  indicators: Indicator[];
  className?: string;
}

interface SymbolOption {
  symbol: string;
  strike_price?: number;
  option_type?: string;
  fyToken?: string;
}

const timeframeOptions = [
  { value: "1", label: "1 Minute", shortLabel: "1m" },
  { value: "5", label: "5 Minutes", shortLabel: "5m" },
  { value: "15", label: "15 Minutes", shortLabel: "15m" },
  { value: "D", label: "1 Day", shortLabel: "1D" },
];

const SymbolScrollList = memo(
  ({
    options,
    selectedIndex,
    onSelect,
    highlightMiddle,
    selectedSymbol,
  }: {
    options: SymbolOption[];
    selectedIndex: number;
    onSelect: (option: SymbolOption) => void;
    highlightMiddle?: boolean;
    selectedSymbol?: string;
  }) => {
    const listRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
      if (listRef.current) {
        const selectedElement = listRef.current.children[
          selectedIndex
        ] as HTMLElement;
        if (selectedElement) {
          selectedElement.scrollIntoView({
            block: "nearest",
            behavior: "smooth",
          });
        }
      }
    }, [selectedIndex]);

    return (
      <div
        ref={listRef}
        className="max-h-[200px] overflow-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600"
      >
        {options.map((option, index) => (
          <div
            key={option.symbol}
            className={cn(
              "px-2 py-1 cursor-pointer text-xs",
              selectedIndex === index && "bg-blue-500 text-white",
              highlightMiddle &&
                index === Math.floor(options.length / 2) &&
                "bg-green-100 dark:bg-green-900",
              selectedSymbol === option.symbol &&
                "bg-gray-200 dark:bg-gray-700",
              "hover:bg-blue-100 dark:hover:bg-blue-900",
              "transition-colors duration-150"
            )}
            onClick={() => onSelect(option)}
          >
            {option.strike_price
              ? `${option.strike_price} ${option.option_type}`
              : option.symbol}
          </div>
        ))}
      </div>
    );
  }
);

export const ChartContainer = memo(
  ({
    layoutTypeKey,
    timeframeConfigs,
    chartKey,
    indicators,
    className,
  }: ChartContainerProps) => {
    const dispatch = useDispatch();
    const { selectedTool, showDrawings, selectedChartKey, chartFullScreenId } =
      useSelector((state: RootState) => state.globalChart);
    const chartState = useSelector((state: RootState) => {
      if (!state.globalChart[layoutTypeKey][chartKey]) {
        dispatch(initializeLayout({ chartKey, layoutTypeKey }));
        return state.globalChart[layoutTypeKey][0] || DEFAULT_CHART_LAYOUT;
      }
      return state.globalChart[layoutTypeKey][chartKey];
    });

    const [isSymbolSearchOpen, setIsSymbolSearchOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const { selectedLayout } = useSelector(
      (state: RootState) => state.globalChart
    );
    const realtimeCandlesConfig = useMemo(
      () => ({
        symbol: chartState.symbol,
        timeframe: chartState.timeframe,
        requestTicksSubscription: false,
      }),
      [chartState.symbol, chartState.timeframe]
    );
    const { chartData, setChartData } = useRealtimeCandles(
      realtimeCandlesConfig
    );
    useEffect(() => {
      if (layoutTypeKey === "optionsChartLayouts") {
        dispatch(
          setChartHistoryForOptions({
            chartKey: chartKey,
            chartData,
          } as any)
        );
      }
    }, [chartData, layoutTypeKey]);

    const currentTimeframe = timeframeOptions.find(
      (t) => t.value === chartState.timeframe
    );

    const symbolDrawings = useSelector(
      (state: RootState) => state.states.drawings[chartState.symbol] || []
    );

    // const [containerWidth, setContainerWidth] = useState<number | null>(null);

    const selectedDrawing = useSelector(
      (state: RootState) => state.globalChart.selectedDrawing
    );

    // const scheduleRender = useOptimizedRenderer();
    // const chartRef = useRef<HTMLDivElement>(null);

    // const handleResize = useCallback(() => {
    //   if (!chartRef.current) return;

    //   scheduleRender(chartKey, () => {
    //     const width = chartRef.current!.offsetWidth;
    //     const roundedWidth = Math.round(width / 30) * 30;
    //     setContainerWidth(roundedWidth);
    //   });
    // }, [chartKey, scheduleRender]);

    // useEffect(() => {
    //   const observer = new ResizeObserver(debounce(handleResize, 100));
    //   if (chartRef.current) {
    //     observer.observe(chartRef.current);
    //   }
    //   return () => observer.disconnect();
    // }, [handleResize]);

    useEffect(() => {
      if (containerRef.current) {
        const resizeEvent = new Event("resize");
        window.dispatchEvent(resizeEvent);
      }
    }, [chartKey, indicators]);

    const handleDrawingComplete = useCallback(
      (drawing: Drawing) => {
        dispatch(addDrawing({ symbol: chartState.symbol, drawing }) as any);
      },
      [dispatch, chartState.symbol]
    );

    const handleDrawingUpdate = useCallback(
      (drawing: Drawing) => {
        dispatch(updateDrawing({ symbol: chartState.symbol, drawing }) as any);
      },
      [dispatch, chartState.symbol]
    );

    const handleChartClick = useCallback(() => {
      dispatch(setSelectedChartKey(chartKey));
    }, [dispatch, chartKey]);

    const currentTimeframeConfig = timeframeConfigs[chartState.timeframe];
    if (!currentTimeframeConfig) {
      console.error(`No timeframe config found for ${chartState.timeframe}`);
      return null; // Or render an error state
    }

    const handleDoubleClick = () => {
      dispatch(setChartFullScreenId(chartKey));
    };

    const [containerDimensions, setContainerDimensions] = useState({
      width: 0,
      height: 0,
    });
    const previousDimensions = useRef({ width: 0, height: 0 });
    const animationRef = useRef<number>();

    // Smooth dimension transition
    const updateDimensions = useCallback(
      (newWidth: number, newHeight: number) => {
        const startWidth = previousDimensions.current.width;
        const startHeight = previousDimensions.current.height;
        const startTime = performance.now();
        const duration = 100; // Animation duration in ms

        // Cancel any existing animation
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current);
        }

        const animate = (currentTime: number) => {
          const elapsed = currentTime - startTime;
          const progress = Math.min(elapsed / duration, 1);

          // Ease out cubic function for smooth transition
          const t = 1 - Math.pow(1 - progress, 3);

          const currentWidth = Math.round(
            startWidth + (newWidth - startWidth) * t
          );
          const currentHeight = Math.round(
            startHeight + (newHeight - startHeight) * t
          );

          setContainerDimensions({
            width: currentWidth,
            height: currentHeight,
          });

          if (progress < 1) {
            animationRef.current = requestAnimationFrame(animate);
          } else {
            previousDimensions.current = { width: newWidth, height: newHeight };
          }
        };

        animationRef.current = requestAnimationFrame(animate);
      },
      []
    );

    // ResizeObserver setup
    useEffect(() => {
      if (!containerRef.current) return;

      const observer = new ResizeObserver((entries) => {
        for (const entry of entries) {
          const { width, height } = entry.contentRect;
          // Only update if change is significant (> 1px)
          if (
            Math.abs(width - previousDimensions.current.width) > 1 ||
            Math.abs(height - previousDimensions.current.height) > 1
          ) {
            updateDimensions(Math.round(width), Math.round(height));
          }
        }
      });

      observer.observe(containerRef.current);

      return () => {
        observer.disconnect();
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current);
        }
      };
    }, [updateDimensions]);

    // Clean up animation on unmount
    useEffect(() => {
      return () => {
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current);
        }
      };
    }, []);

    const [isSymbolScrollOpen, setIsSymbolScrollOpen] = useState(false);
    const scalpingMode = layoutTypeKey === "optionsChartLayouts";
    const { optionChainData } = useSelector(
      (state: RootState) => state.globalChart
    );
    const getFilteredOptions = useCallback(() => {
      if (chartKey === "1") {
        return [
          ...Object.keys(INDEX_DETAILS).map((index) => ({
            symbol: index,
            type: "index",
            name: index,
          })),
        ];
      }

      if (!optionChainData?.data) return [];

      return optionChainData.data
        .filter((item: any) =>
          chartKey === "0"
            ? item.option_type === "CE"
            : item.option_type === "PE"
        )
        .map((item: any) => ({
          symbol: item.symbol,
          strike_price: item.strike_price,
          option_type: item.option_type,
          fyToken: item.fyToken,
        }));
    }, [chartKey, optionChainData]);

    const [selectedScrollIndex, setSelectedScrollIndex] = useState(() => {
      const options = getFilteredOptions();
      const currentIndex = options.findIndex(
        (opt: SymbolOption) => opt.symbol === chartState.symbol
      );
      return currentIndex >= 0 ? currentIndex : 0;
    });

    // useEffect(() => {
    //   if (!isSymbolScrollOpen) return;

    //   const handleKeyDown = (e: KeyboardEvent) => {
    //     if (!scalpingMode || selectedChartKey !== chartKey) return;

    //     const options = getFilteredOptions();
    //     if (options.length === 0) return;

    //     if (e.key === "ArrowUp") {
    //       e.preventDefault();
    //       setSelectedScrollIndex((prev) =>
    //         prev <= 0 ? options.length - 1 : prev - 1
    //       );
    //     } else if (e.key === "ArrowDown") {
    //       console.log("arrow down");
    //       e.preventDefault();
    //       setSelectedScrollIndex((prev) =>
    //         prev >= options.length - 1 ? 0 : prev + 1
    //       );
    //     } else if (e.key === "Enter") {
    //       e.preventDefault();
    //       const selectedOption = options[selectedScrollIndex];
    //       if (selectedOption) {
    //         handleSymbolSelect(selectedOption);
    //         setIsSymbolScrollOpen(false);
    //       }
    //     } else if (e.key === "Escape") {
    //       setIsSymbolScrollOpen(false);
    //     }
    //   };

    //   window.addEventListener("keydown", handleKeyDown);
    //   return () => window.removeEventListener("keydown", handleKeyDown);
    // }, [
    //   isSymbolScrollOpen,
    //   selectedScrollIndex,
    //   getFilteredOptions,
    //   scalpingMode,
    //   selectedChartKey,
    //   chartKey,
    // ]);

    const handleSymbolSelect = (option: SymbolOption) => {
      if (option.fyToken) {
        dispatch(
          updateLayoutSymbol({
            chartKey,
            symbol: option.symbol,
            symbolInfo: option,
            layoutTypeKey,
          })
        );
      } else {
        dispatch(
          updateLayoutSymbol({
            chartKey,
            symbol: shoonyaToFyersSymbol(option, updateFyersToShoonyaMapping),
            layoutTypeKey,
            mainSymbol: option.symbol,
          })
        );
      }
      setIsSymbolScrollOpen(false);
    };

    useEffect(() => {
      const options = getFilteredOptions();
      const currentIndex = options.findIndex(
        (opt: SymbolOption) => opt.symbol === chartState.symbol
      );
      setSelectedScrollIndex(currentIndex >= 0 ? currentIndex : 0);
    }, [chartState.symbol, getFilteredOptions]);

    return (
      <div
        className={cn(
          "flex flex-col h-full relative",
          selectedChartKey === chartKey && selectedLayout !== "single"
            ? "border-blue-500 border dark:border-0.5"
            : "border-transparent border dark:border-0.5",
          chartFullScreenId === chartKey
            ? "absolute inset-0 z-[151]"
            : chartFullScreenId
              ? "w-0"
              : "",
          className
        )}
        onMouseDown={handleChartClick}
        onKeyDown={(e) => {
          // Check if any input element is focused
          const activeElement = document.activeElement;
          const isInputFocused =
            activeElement instanceof HTMLInputElement ||
            activeElement instanceof HTMLTextAreaElement ||
            activeElement instanceof HTMLSelectElement;

          if (isInputFocused) return;

          if (
            scalpingMode &&
            selectedChartKey === chartKey &&
            (e.key === "ArrowUp" || e.key === "ArrowDown")
          ) {
            e.preventDefault();
            const options = getFilteredOptions();
            if (options.length === 0) return;

            if (!isSymbolScrollOpen) {
              setIsSymbolScrollOpen(true);
            } else {
              setSelectedScrollIndex((prev: number) => {
                if (e.key === "ArrowUp") {
                  return prev <= 0 ? options.length - 1 : prev - 1;
                } else {
                  return prev >= options.length - 1 ? 0 : prev + 1;
                }
              });
            }
          } else if (e.key === "Enter" && isSymbolScrollOpen) {
            e.preventDefault();
            const selectedOption = getFilteredOptions()[selectedScrollIndex];
            if (selectedOption) {
              handleSymbolSelect(selectedOption);
            }
          } else if (e.key === "Escape" && isSymbolScrollOpen) {
            setIsSymbolScrollOpen(false);
          }
        }}
        tabIndex={0}
      >
        {/* Chart Header */}
        <div className="flex items-center p-1 border-b border-border bg-background">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center">
              {/* Symbol Button */}
              <Button
                variant="ghost"
                onClick={() => setIsSymbolSearchOpen(true)}
                className="h-6 px-2 text-sm hover:bg-muted"
              >
                <DisplaySymbol
                  chartState={chartState}
                  layoutTypeKey={layoutTypeKey}
                />
                <span className="text-xs text-muted-foreground">NSE</span>
              </Button>

              <Separator orientation="vertical" className="mx-1 h-4" />

              {/* Timeframe Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="h-6 px-2 text-sm hover:bg-muted"
                  >
                    {currentTimeframe?.shortLabel}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-[120px]">
                  {timeframeOptions.map((option) => (
                    <DropdownMenuItem
                      key={option.value}
                      onClick={() => {
                        if (layoutTypeKey === "optionsChartLayouts") {
                          dispatch(
                            updateLayoutTimeframe({
                              chartKey: "0",
                              timeframe: option.value,
                              layoutTypeKey,
                            })
                          );
                          dispatch(
                            updateLayoutTimeframe({
                              chartKey: "1",
                              timeframe: option.value,
                              layoutTypeKey,
                            })
                          );
                          dispatch(
                            updateLayoutTimeframe({
                              chartKey: "2",
                              timeframe: option.value,
                              layoutTypeKey,
                            })
                          );
                        } else {
                          dispatch(
                            updateLayoutTimeframe({
                              chartKey,
                              timeframe: option.value,
                              layoutTypeKey,
                            })
                          );
                        }
                      }}
                      className={cn(
                        chartState.timeframe === option.value
                          ? "bg-muted"
                          : "hover:bg-muted"
                      )}
                    >
                      <span>{option.label}</span>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <ShowPL chartState={chartState} />
          </div>
        </div>
        {/* Alert Button */}
        {selectedDrawing?.symbol === chartState.symbol && (
          <div className="absolute right-0 top-[33px] z-[500]">
            <AlertBuySellWindow
              selectedDrawing={selectedDrawing}
              onClose={() => dispatch(setSelectedDrawing(null))}
            />
          </div>
        )}

        {/* Chart Content */}
        {isSymbolSearchOpen && (
          <SymbolSearch
            isOpen={isSymbolSearchOpen}
            onClose={() => setIsSymbolSearchOpen(false)}
            onSymbolSelect={(symbol: any) => {
              setChartData([]);
              if (symbol.fyToken) {
                // if symbol has fyToken, then no need to update fyers to shoonya mapping
                dispatch(
                  updateLayoutSymbol({
                    chartKey,
                    symbol: symbol.symbol,
                    symbolInfo: symbol,
                    layoutTypeKey,
                  })
                );
              } else {
                dispatch(
                  updateLayoutSymbol({
                    chartKey,
                    layoutTypeKey,
                    symbol: shoonyaToFyersSymbol(
                      symbol,
                      updateFyersToShoonyaMapping
                    ),
                  })
                );
              }
              setIsSymbolSearchOpen(false);
            }}
          />
        )}
        <div
          className="flex-1 min-h-0"
          style={{ height: 300 }}
          onDoubleClick={handleDoubleClick}
          ref={containerRef}
        >
          <CanvasChart
            data={chartData}
            timeframeConfig={currentTimeframeConfig}
            indicators={indicators}
            selectedTool={selectedTool}
            showDrawings={showDrawings}
            drawings={symbolDrawings}
            onDrawingComplete={handleDrawingComplete}
            onDrawingUpdate={handleDrawingUpdate}
            chartState={chartState}
            chartKey={chartKey}
            dimensions={{
              ...containerDimensions,
              width: containerDimensions.width,
              height: containerDimensions.height - 30,
              padding: { top: 0, right: 60, bottom: 0, left: 0 },
            }}
          />
        </div>
        {scalpingMode &&
          selectedChartKey === chartKey &&
          isSymbolScrollOpen && (
            <Popover
              open={isSymbolScrollOpen}
              onOpenChange={setIsSymbolScrollOpen}
            >
              <PopoverTrigger asChild>
                <div className="absolute inset-0 flex items-center justify-center" />
              </PopoverTrigger>
              <PopoverContent
                className="w-[160px] p-0 shadow-md"
                align="center"
                alignOffset={0}
                side="bottom"
                sideOffset={-500}
                avoidCollisions={false}
              >
                <SymbolScrollList
                  options={getFilteredOptions()}
                  selectedIndex={selectedScrollIndex}
                  onSelect={handleSymbolSelect}
                  highlightMiddle={chartKey !== "2"}
                  selectedSymbol={chartState.symbol}
                />
              </PopoverContent>
            </Popover>
          )}
      </div>
    );
  }
);

const DisplaySymbol = ({
  chartState,
  layoutTypeKey,
}: {
  chartState: any;
  layoutTypeKey: LayoutKeyType;
}) => {
  return (
    <span className="mr-1">
      {chartState.symbolInfo?.strike_price &&
      layoutTypeKey === "optionsChartLayouts"
        ? `${chartState.symbolInfo.strike_price} ${chartState.symbolInfo.option_type}`
        : chartState.symbol.split(":")[1]?.replace("-INDEX", "") || ""}
    </span>
  );
};

const ShowPL = ({ chartState }: { chartState: any }) => {
  const positions = useSelector(
    (state: RootState) => state.states.shoonya?.positions || []
  );
  const tick = useSelector(
    (state: RootState) => state.ticks.fyers_web[chartState.symbol]
  );
  const hasPosition = positions.find(
    (i: any) =>
      i.tsym ===
      fetchShoonyaNameByFyersSymbol({
        symbol: chartState.symbol,
        strike_price: chartState.symbolInfo?.strike_price,
        option_type: chartState.symbolInfo?.option_type,
        expiryDate: chartState.symbolInfo?.expiryDate,
      })?.tsym
  );

  const pnl =
    hasPosition && getCurrentShoonyaPositionPL(hasPosition, +tick?.ltp || 0);

  return (
    <div>
      {hasPosition && (
        <div className="flex items-center gap-1 text-sm">
          <div>{hasPosition?.netqty} qty</div>
          <div
            className={cn(
              "min-w-[80px] text-right font-medium tabular-nums",
              PRICECOLOR(pnl)
            )}
          >
            {pnl.toFixed(2)}
          </div>
        </div>
      )}
    </div>
  );
};
