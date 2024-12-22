import {
  createChart,
  ColorType,
  LineStyle,
  IChartApi,
  ISeriesApi,
  CrosshairMode,
  PriceScaleMode,
} from "lightweight-charts";
import React, { useEffect, useRef, useState } from "react";

interface OptionData {
  time: string;
  value: number;
}

interface Strike {
  price: number;
  data: OptionData[];
  color: string;
  label?: string;
  visible?: boolean;
}

interface OptionsAnalyzerProps {
  strikes: Strike[];
  width?: number;
  height?: number;
  colors?: {
    backgroundColor?: string;
    textColor?: string;
    gridColor?: string;
    legendBackground?: string;
  };
  onStrikeVisibilityChange?: (price: number, visible: boolean) => void;
}

interface TooltipData {
  price: number;
  value: number;
  color: string;
  label?: string;
  time?: string;
}

export const OptionsAnalyzer: React.FC<OptionsAnalyzerProps> = ({
  strikes,
  width = 800,
  height = 400,
  colors = {},
  onStrikeVisibilityChange,
}) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const legendRef = useRef<HTMLDivElement>(null);
  const [chart, setChart] = useState<IChartApi | null>(null);
  const seriesRef = useRef<Map<number, ISeriesApi<"Line">>>(new Map());
  const [tooltipData, setTooltipData] = useState<TooltipData[]>([]);
  const [tooltipPosition, setTooltipPosition] = useState<{
    x: number;
    y: number;
  }>({ x: 0, y: 0 });
  const [showTooltip, setShowTooltip] = useState(false);

  // Initialize chart
  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chartInstance = createChart(chartContainerRef.current, {
      width,
      height,
      layout: {
        background: {
          type: ColorType.Solid,
          color: colors.backgroundColor || "#1E222D",
        },
        textColor: colors.textColor || "#DDD",
      },
      grid: {
        vertLines: {
          color: colors.gridColor || "#2B2B43",
          style: LineStyle.Dotted,
        },
        horzLines: {
          color: colors.gridColor || "#2B2B43",
          style: LineStyle.Dotted,
        },
      },
      rightPriceScale: {
        borderVisible: false,
        mode: PriceScaleMode.Normal,
        autoScale: true,
      },
      timeScale: {
        borderVisible: false,
        timeVisible: true,
        secondsVisible: true,
        tickMarkFormatter: (timestamp: number) => {
          const date = new Date(timestamp * 1000);
          return date.toLocaleTimeString("en-US", {
            hour12: false,
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
          });
        },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: {
          labelVisible: true,
          labelBackgroundColor:
            colors.legendBackground || "rgba(30, 34, 45, 0.9)",
        },
        horzLine: {
          labelVisible: true,
          labelBackgroundColor:
            colors.legendBackground || "rgba(30, 34, 45, 0.9)",
        },
      },
      localization: {
        timeFormatter: (timestamp: number) => {
          const date = new Date(timestamp * 1000);
          return date.toLocaleTimeString("en-US", {
            hour12: false,
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
          });
        },
      },
    });

    setChart(chartInstance);

    // Handle resizing
    const handleResize = () => {
      if (chartContainerRef.current) {
        chartInstance.applyOptions({
          width: chartContainerRef.current.clientWidth,
        });
      }
    };

    window.addEventListener("resize", handleResize);

    // Subscribe to crosshair move with improved time formatting
    chartInstance.subscribeCrosshairMove((param) => {
      if (
        param.point === undefined ||
        !param.time ||
        param.point.x < 0 ||
        param.point.y < 0
      ) {
        setShowTooltip(false);
        return;
      }

      const tooltipData: TooltipData[] = [];
      strikes.forEach((strike) => {
        if (seriesRef.current.has(strike.price)) {
          const series = seriesRef.current.get(strike.price);
          const price = series?.coordinateToPrice(param.point?.y ?? 0);
          if (price !== null && price !== undefined) {
            const timestamp = param.time as number;
            const date = new Date(timestamp * 1000);
            tooltipData.push({
              price: strike.price,
              value: price,
              color: strike.color,
              label: strike.label,
              time: date.toLocaleTimeString("en-US", {
                hour12: false,
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
              }),
            });
          }
        }
      });

      setTooltipData(tooltipData);
      setTooltipPosition({ x: param.point.x, y: param.point.y });
      setShowTooltip(true);
    });

    return () => {
      window.removeEventListener("resize", handleResize);
      chartInstance.remove();
    };
  }, [colors, height, strikes, width]);

  // Update series when strikes change
  useEffect(() => {
    if (!chart || !chartContainerRef.current) return;

    // Clear existing series
    seriesRef.current.forEach((series) => {
      chart.removeSeries(series);
    });
    seriesRef.current.clear();

    // Add new series for each strike
    strikes.forEach((strike) => {
      if (strike.visible !== false) {
        const series = chart.addLineSeries({
          color: strike.color,
          lineWidth: 2,
          title: strike.label || `Strike ${strike.price}`,
          priceFormat: {
            type: "price",
            precision: 2,
            minMove: 0.01,
          },
        });
        series.setData(strike.data);
        seriesRef.current.set(strike.price, series);
      }
    });

    // Fit content to view
    chart.timeScale().fitContent();
  }, [chart, strikes]);

  const handleLegendItemClick = (price: number) => {
    onStrikeVisibilityChange?.(
      price,
      !strikes.find((s) => s.price === price)?.visible
    );
  };

  return (
    <div style={{ position: "relative" }}>
      <div
        ref={chartContainerRef}
        style={{
          position: "relative",
          width: "100%",
        }}
      />

      {/* Legend */}
      <div
        ref={legendRef}
        style={{
          position: "absolute",
          top: 10,
          right: 10,
          background: colors.legendBackground || "rgba(30, 34, 45, 0.9)",
          padding: "10px",
          borderRadius: "4px",
          color: colors.textColor || "#DDD",
        }}
      >
        {strikes.map((strike) => (
          <div
            key={strike.price}
            style={{
              display: "flex",
              alignItems: "center",
              cursor: "pointer",
              opacity: strike.visible === false ? 0.5 : 1,
              marginBottom: "5px",
            }}
            onClick={() => handleLegendItemClick(strike.price)}
          >
            <div
              style={{
                width: 12,
                height: 12,
                backgroundColor: strike.color,
                marginRight: 8,
                borderRadius: "50%",
              }}
            />
            <span>{strike.label || `Strike ${strike.price}`}</span>
          </div>
        ))}
      </div>

      {/* Tooltip */}
      {showTooltip && (
        <div
          style={{
            position: "absolute",
            left: tooltipPosition.x + 15,
            top: tooltipPosition.y + 15,
            backgroundColor: colors.legendBackground || "rgba(30, 34, 45, 0.9)",
            padding: "8px",
            borderRadius: "4px",
            color: colors.textColor || "#DDD",
            fontSize: "12px",
            pointerEvents: "none",
            zIndex: 100,
          }}
        >
          <div style={{ marginBottom: "4px", borderBottom: "1px solid #666" }}>
            {tooltipData[0]?.time}
          </div>
          {tooltipData.map((data, index) => (
            <div
              key={data.price}
              style={{
                display: "flex",
                alignItems: "center",
                marginBottom: index === tooltipData.length - 1 ? 0 : 4,
              }}
            >
              <div
                style={{
                  width: 8,
                  height: 8,
                  backgroundColor: data.color,
                  marginRight: 6,
                  borderRadius: "50%",
                }}
              />
              <span>
                {data.label || `Strike ${data.price}`}: {data.value.toFixed(2)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Example usage:
export const OptionsAnalyzerExample: React.FC = () => {
  const sampleData: Strike[] = [
    {
      price: 100,
      color: "#2962FF",
      label: "ITM Call",
      data: [
        { time: "2024-01-01 09:30:00", value: 5.2 },
        { time: "2024-01-01 09:30:05", value: 5.5 },
        { time: "2024-01-01 09:30:10", value: 5.3 },
        { time: "2024-01-01 09:30:15", value: 5.7 },
        { time: "2024-01-01 09:30:20", value: 5.4 },
      ].map((item) => ({
        time: Math.floor(new Date(item.time).getTime() / 1000).toString(),
        value: item.value,
      })),
    },
    {
      price: 110,
      color: "#FF2962",
      label: "ATM Call",
      data: [
        { time: "2024-01-01 09:30:00", value: 3.2 },
        { time: "2024-01-01 09:30:05", value: 3.5 },
        { time: "2024-01-01 09:30:10", value: 3.1 },
        { time: "2024-01-01 09:30:15", value: 3.8 },
        { time: "2024-01-01 09:30:20", value: 3.3 },
      ].map((item) => ({
        time: Math.floor(new Date(item.time).getTime() / 1000).toString(),
        value: item.value,
      })),
    },
    {
      price: 120,
      color: "#29FF62",
      label: "OTM Call",
      data: [
        { time: "2024-01-01 09:30:00", value: 1.8 },
        { time: "2024-01-01 09:30:05", value: 2.1 },
        { time: "2024-01-01 09:30:10", value: 1.9 },
        { time: "2024-01-01 09:30:15", value: 2.3 },
        { time: "2024-01-01 09:30:20", value: 2.0 },
      ].map((item) => ({
        time: Math.floor(new Date(item.time).getTime() / 1000).toString(),
        value: item.value,
      })),
    },
  ];

  return (
    <div style={{ padding: "20px" }}>
      <h2>Options Price Analysis</h2>
      <OptionsAnalyzer
        strikes={sampleData}
        height={500}
        colors={{
          backgroundColor: "#1E222D",
          textColor: "#DDD",
          gridColor: "#2B2B43",
          legendBackground: "rgba(30, 34, 45, 0.9)",
        }}
      />
    </div>
  );
};
