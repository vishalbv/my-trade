const ctx: Worker = self as any;

interface OHLCData {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  display?: boolean;
}

interface ViewState {
  scaleX: number;
  scaleY: number;
  offsetY: number;
  startIndex: number;
  visibleBars: number;
}

interface Dimensions {
  width: number;
  height: number;
  padding: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
}

interface CandleCalculation {
  x: number;
  candleLeft: number;
  candleWidth: number;
  openY: number;
  closeY: number;
  highY: number;
  lowY: number;
  color: "up" | "down";
}

const getY = (
  price: number,
  min: number,
  max: number,
  chartHeight: number,
  offsetY: number,
  scaleY: number
) => {
  const range = (max - min) / scaleY;
  const pixelsPerPrice = chartHeight / range;
  return chartHeight - (price - min + offsetY) * pixelsPerPrice;
};

ctx.addEventListener("message", (event) => {
  const { type, data } = event.data;

  switch (type) {
    case "PROCESS_VISIBLE_DATA": {
      const {
        data: visibleData,
        viewState,
        dimensions,
        rsiHeight,
      } = data as {
        data: OHLCData[];
        viewState: ViewState;
        dimensions: Dimensions;
        rsiHeight: number;
      };

      // Calculate chart dimensions
      const chartHeight = dimensions.height - (rsiHeight ? rsiHeight + 34 : 30);
      const chartWidth =
        dimensions.width - dimensions.padding.left - dimensions.padding.right;
      const barWidth = chartWidth / viewState.visibleBars;
      const candleWidth = barWidth * 0.8;

      // Calculate price ranges
      const prices = visibleData.flatMap((candle: OHLCData) => [
        candle.high,
        candle.low,
      ]);
      const minPrice = Math.min(...prices);
      const maxPrice = Math.max(...prices);
      const priceRange = maxPrice - minPrice;
      const pricePadding = priceRange * 0.15;
      const adjustedMin = minPrice - pricePadding;
      const adjustedMax = maxPrice + pricePadding;

      // Pre-calculate all candle positions and dimensions
      const candles: CandleCalculation[] = visibleData.map(
        (candle: OHLCData, i: number) => {
          const x = dimensions.padding.left + i * barWidth;
          const candleLeft = x + (barWidth - candleWidth) / 2;

          return {
            x,
            candleLeft,
            candleWidth,
            openY: getY(
              candle.open,
              adjustedMin,
              adjustedMax,
              chartHeight,
              viewState.offsetY,
              viewState.scaleY
            ),
            closeY: getY(
              candle.close,
              adjustedMin,
              adjustedMax,
              chartHeight,
              viewState.offsetY,
              viewState.scaleY
            ),
            highY: getY(
              candle.high,
              adjustedMin,
              adjustedMax,
              chartHeight,
              viewState.offsetY,
              viewState.scaleY
            ),
            lowY: getY(
              candle.low,
              adjustedMin,
              adjustedMax,
              chartHeight,
              viewState.offsetY,
              viewState.scaleY
            ),
            color: candle.close >= candle.open ? "up" : "down",
          };
        }
      );

      ctx.postMessage({
        type: "PROCESSED_DATA_RESULT",
        data: {
          candles,
          priceRange: {
            min: adjustedMin,
            max: adjustedMax,
            padding: pricePadding,
          },
          dimensions: {
            chartHeight,
            chartWidth,
            barWidth,
          },
        },
      });
      break;
    }
  }
});
