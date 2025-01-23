import {
  createChart,
  ColorType,
  LineStyle,
  IChartApi,
  ISeriesApi,
  CrosshairMode,
  PriceScaleMode,
  Time,
} from "lightweight-charts";
import React, { useEffect, useRef, useState } from "react";

interface DataPoint {
  time: Time;
  value: number;
}

interface SeriesData {
  data: DataPoint[];
  color: string;
  label: string;
  visible?: boolean;
}

interface MultiSeriesChartProps {
  series: SeriesData[];
  width?: number;
  height?: number;
  colors?: {
    backgroundColor?: string;
    textColor?: string;
    gridColor?: string;
    legendBackground?: string;
  };
  onSeriesVisibilityChange?: (label: string, visible: boolean) => void;
  autoScale?: boolean;
  showLegend?: boolean;
  showTooltip?: boolean;
}

interface TooltipData {
  label: string;
  value: number;
  color: string;
  time?: string;
}

export const MultiSeriesChart: React.FC<MultiSeriesChartProps> = ({
  series,
  width = 400,
  height = 400,
  colors = {},
  onSeriesVisibilityChange,
  autoScale = true,
  showLegend = true,
  showTooltip = true,
}) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const legendRef = useRef<HTMLDivElement>(null);
  const [chart, setChart] = useState<IChartApi | null>(null);
  const seriesRef = useRef<Map<string, ISeriesApi<"Line">>>(new Map());
  const [tooltipData, setTooltipData] = useState<TooltipData[]>([]);
  const [tooltipPosition, setTooltipPosition] = useState<{
    x: number;
    y: number;
  }>({ x: 0, y: 0 });
  const [showTooltipState, setShowTooltipState] = useState(false);

  // Initialize chart
  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chartInstance = createChart(chartContainerRef.current, {
      width: chartContainerRef.current.clientWidth || width,
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
        mode: autoScale ? PriceScaleMode.Normal : PriceScaleMode.Logarithmic,
        autoScale: true,
        scaleMargins: {
          top: 0.1,
          bottom: 0.1,
        },
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

    // Handle tooltip
    let tooltipSubscription: any;

    if (showTooltip) {
      tooltipSubscription = chartInstance.subscribeCrosshairMove((param) => {
        if (
          param.point === undefined ||
          !param.time ||
          param.point.x < 0 ||
          param.point.y < 0
        ) {
          setShowTooltipState(false);
          return;
        }

        const tooltipData: TooltipData[] = [];
        series.forEach((s) => {
          if (seriesRef.current.has(s.label)) {
            const series = seriesRef.current.get(s.label);
            const price = series?.coordinateToPrice(param.point?.y ?? 0);
            if (price !== null && price !== undefined) {
              const timestamp = param.time as number;
              const date = new Date(timestamp * 1000);
              tooltipData.push({
                label: s.label,
                value: price as number,
                color: s.color,
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

        if (tooltipData.length > 0) {
          setTooltipData(tooltipData);
          setTooltipPosition({ x: param.point.x, y: param.point.y });
          setShowTooltipState(true);
        } else {
          setShowTooltipState(false);
        }
      });
    }

    return () => {
      window.removeEventListener("resize", handleResize);
      if (tooltipSubscription) {
        tooltipSubscription();
      }
      chartInstance.remove();
    };
  }, [colors, height, width, autoScale, showTooltip, series]);

  // Update series
  useEffect(() => {
    if (!chart) return;

    // Clear existing series
    seriesRef.current.forEach((series) => {
      chart.removeSeries(series);
    });
    seriesRef.current.clear();

    // Add new series
    series.forEach((s) => {
      if (s.visible !== false) {
        const lineSeries = chart.addLineSeries({
          color: s.color,
          lineWidth: 2,
          title: s.label,
          priceFormat: {
            type: "price",
            precision: 2,
            minMove: 0.01,
          },
        });

        lineSeries.setData(s.data);
        seriesRef.current.set(s.label, lineSeries);
      }
    });

    chart.timeScale().fitContent();
  }, [chart, series]);

  const handleLegendItemClick = (label: string) => {
    onSeriesVisibilityChange?.(
      label,
      !series.find((s) => s.label === label)?.visible
    );
  };

  return (
    <div style={{ position: "relative", width: "100%", height }}>
      <div
        ref={chartContainerRef}
        style={{
          position: "relative",
          width: "100%",
          height: "100%",
        }}
      />

      {showLegend && (
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
            zIndex: 2,
          }}
        >
          {series.map((s) => (
            <div
              key={s.label}
              style={{
                display: "flex",
                alignItems: "center",
                cursor: "pointer",
                opacity: s.visible === false ? 0.5 : 1,
                marginBottom: "5px",
              }}
              onClick={() => handleLegendItemClick(s.label)}
            >
              <div
                style={{
                  width: 12,
                  height: 12,
                  backgroundColor: s.color,
                  marginRight: 8,
                  borderRadius: "50%",
                }}
              />
              <span>{s.label}</span>
            </div>
          ))}
        </div>
      )}

      {showTooltip && showTooltipState && (
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
              key={data.label}
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
                {data.label}: {data.value.toFixed(2)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
