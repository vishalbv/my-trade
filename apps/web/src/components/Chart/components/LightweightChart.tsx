import {
  createChart,
  IChartApi,
  LineData,
  ISeriesApi,
  LineStyle,
  Time,
  DeepPartial,
  ChartOptions,
} from "lightweight-charts";
import React, { useEffect, useRef, useState } from "react";
import { useTheme } from "next-themes";
import { themes, CHART_FONT_FAMILY } from "../constants/themes";
import { formatTimeForChart } from "../utils/chartTransformations";
import { MoveRight } from "lucide-react";
import { Button } from "@repo/ui/button";

interface SeriesData {
  data: Array<{ time: number; value: number }>;
  color: string;
  lineWidth?: number;
  priceLineVisible?: boolean;
  name: string;
  label: string;
  scaleRange?: {
    minValue?: number;
    maxValue?: number;
  };
  priceScaleId?: string;
  scalePosition?: "left" | "right";
}

const Legend: React.FC<{ series: SeriesData[] }> = ({ series }) => {
  return (
    <div
      style={{
        display: "flex",
        gap: "16px",
        padding: "8px",
        justifyContent: "center",
        flexWrap: "wrap",
      }}
    >
      {series.map((item, index) => (
        <div
          key={index}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "4px",
          }}
        >
          <div
            style={{
              width: "16px",
              height: "3px",
              backgroundColor: item.color,
              borderRadius: "1px",
            }}
          />
          <span style={{ fontSize: "12px" }}>{item.label}</span>
        </div>
      ))}
    </div>
  );
};

interface LightweightChartProps {
  containerId?: string;
  width?: number;
  height?: number;
  series: SeriesData[];
  legendEnabled?: boolean;
}

export const LightweightChart: React.FC<LightweightChartProps> = ({
  containerId = "lightweight-chart",
  width = 800,
  height = 360,
  series,
  legendEnabled = true,
  selectedTransformation,
}) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const [chart, setChart] = useState<IChartApi | null>(null);
  const seriesApiRef = useRef<ISeriesApi<"Line">[]>([]);
  const chartRef = useRef<IChartApi | null>(null);
  const { theme } = useTheme();

  // Effect for chart initialization and cleanup
  useEffect(() => {
    if (!chartContainerRef.current) return;

    // Clean up existing chart
    if (chartRef.current) {
      seriesApiRef.current = [];
      try {
        chartRef.current.remove();
      } catch (error) {
        console.warn("Error removing old chart:", error);
      }
      chartRef.current = null;
    }

    const currentTheme = themes[theme as keyof typeof themes] || themes.light;

    try {
      const chartInstance = createChart(chartContainerRef.current, {
        layout: {
          background: { type: "solid", color: currentTheme.background },
          textColor: currentTheme.text,
          fontFamily: CHART_FONT_FAMILY,
          fontSize: 11,
        },
        grid: {
          vertLines: { color: currentTheme.grid },
          horzLines: { color: currentTheme.grid },
        },

        crosshair: {
          mode: 0,
          vertLine: {
            color: currentTheme.crosshair,
            style: LineStyle.Dashed,
          },
          horzLine: {
            color: currentTheme.crosshair,
            style: LineStyle.Dashed,
          },
        },

        timeScale: {
          borderColor: currentTheme.grid,
          timeVisible: true,
          secondsVisible: false,
          borderVisible: true,
          ticksVisible: true,
          //   rightBarStagePercentage: 10,
          barSpacing: 6,
          minBarSpacing: 4,
          fixRightEdge: false,
          rightOffset: 1,
          shiftVisibleRangeOnNewBar: true,
        },
        rightPriceScale: {
          visible: false,
          borderVisible: true,
          borderColor: currentTheme.grid,
          textColor: currentTheme.text,
          mode: 2,
          scaleMargins: {
            top: 0.1,
            bottom: 0.1,
          },
        },

        leftPriceScale: {
          visible: false,
          borderVisible: true,
          borderColor: currentTheme.grid,
          textColor: currentTheme.text,
          mode: 2,
          invertScale: true,
          scaleMargins: {
            top: 0.1,
            bottom: 0.1,
          },
        },

        width,
        height,
      });

      // Store chart instance in both state and ref
      chartRef.current = chartInstance;
      setChart(chartInstance);

      let resizeTimeout: NodeJS.Timeout;
      const handleResize = (entries: ResizeObserverEntry[]) => {
        if (!chartRef.current) return;

        const { width: newWidth, height: newHeight } = entries[0].contentRect;

        // Clear any pending resize
        if (resizeTimeout) {
          clearTimeout(resizeTimeout);
        }

        // Debounce the resize operation
        resizeTimeout = setTimeout(() => {
          try {
            if (!chartRef.current) return;

            chartRef.current.applyOptions({
              width: newWidth,
              height: newHeight,
            });

            // After resize, reset the visible range
            if (series.length > 0) {
              const lastIndex = series[0].data.length - 1;
              const startIndex = Math.max(0, lastIndex - 10);

              chartRef.current.timeScale().setVisibleLogicalRange({
                from: startIndex - 10,
                to: lastIndex + 4,
              });
            }
          } catch (error) {
            console.warn("Error handling resize:", error);
          }
        }, 10); // 100ms debounce
      };

      const resizeObserver = new ResizeObserver(handleResize);
      resizeObserver.observe(chartContainerRef.current);

      return () => {
        if (resizeTimeout) {
          clearTimeout(resizeTimeout);
        }
        resizeObserver.disconnect();
        if (chartRef.current) {
          try {
            seriesApiRef.current = [];
            chartRef.current.remove();
          } catch (error) {
            console.warn("Error cleaning up chart:", error);
          }
          chartRef.current = null;
          setChart(null);
        }
      };
    } catch (error) {
      console.error("Error creating chart:", error);
    }
  }, [theme, selectedTransformation]);

  // Separate effect for handling series data
  useEffect(() => {
    if (!chartRef.current || !series.length) return;

    try {
      // Clear existing series
      seriesApiRef.current.forEach((existingSeries) => {
        if (existingSeries && chartRef.current) {
          try {
            chartRef.current.removeSeries(existingSeries);
          } catch (error) {
            console.warn("Error removing series:", error);
          }
        }
      });
      seriesApiRef.current = [];

      // Add new series
      series.forEach((s, index) => {
        if (!s?.data || !chartRef.current) return;

        try {
          const lineSeries = chartRef.current.addLineSeries({
            color: s.color || "#2962FF",
            title: s.name || `Series ${index}`,
            priceScaleId: s.scalePosition === "left" ? "left" : "right",
            priceFormat: {
              type: "percent",
              precision: 2,
              minMove: 0.01,
            },
            lineWidth: s.lineWidth || 2,
            lastValueVisible: true,
            priceLineVisible: s.priceLineVisible ?? true,
            baseLineVisible: false,
            visible: true,
          });

          lineSeries.setData(s.data);
          seriesApiRef.current.push(lineSeries);
        } catch (error) {
          console.warn(`Error adding series ${index}:`, error);
        }
      });

      // Set the scale after adding series
      const lastIndex = series[0].data.length - 1;
      const startIndex = Math.max(0, lastIndex - 10);

      // Wait for next frame to ensure series are rendered
      //   requestAnimationFrame(() => {
      //     if (!chartRef.current) return;

      //     chartRef.current.timeScale().setVisibleLogicalRange({
      //       from: startIndex - 10,
      //       to: lastIndex + 4,
      //     });
      //   });
    } catch (error) {
      console.error("Error updating series:", error);
    }
  }, [chartRef.current, series]);

  const handleMoveToRealTime = () => {
    if (chartRef.current) {
      chartRef.current.timeScale().scrollToRealTime();
    }
  };

  return (
    <div className="relative">
      {legendEnabled && <Legend series={series} />}
      <div
        id={containerId}
        ref={chartContainerRef}
        style={{
          width: "100%",
          height: height,
          cursor: "crosshair",
        }}
      />
      <Button
        variant={"light"}
        size={"iconSm"}
        onClick={handleMoveToRealTime}
        className="absolute bottom-1 right-8 z-10
                   text-foreground p-2 shadow-md transition-colors"
        title="Move to latest data"
      >
        <ScrollToRightIcon />
      </Button>
    </div>
  );
};

const ScrollToRightIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 18 18"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M6 5L10 9L6 13"
      stroke="currentColor"
      strokeWidth="1.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M10 5L14 9L10 13"
      stroke="currentColor"
      strokeWidth="1.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);
