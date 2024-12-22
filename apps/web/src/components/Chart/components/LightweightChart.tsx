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
  height = 400,
  series,
  legendEnabled = true,
}) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const [chart, setChart] = useState<IChartApi | null>(null);
  const seriesApiRef = useRef<ISeriesApi<"Line">[]>([]);
  const { theme } = useTheme();

  // Effect for chart initialization and cleanup
  useEffect(() => {
    if (!chartContainerRef.current) return;

    const currentTheme = themes[theme as keyof typeof themes] || themes.light;

    const themedChartOptions: DeepPartial<ChartOptions> = {
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
      },
      rightPriceScale: {
        visible: true,
        borderVisible: true,
        borderColor: currentTheme.grid,
        textColor: currentTheme.text,
      },
    };

    // Create new chart instance
    const chartInstance = createChart(chartContainerRef.current, {
      ...themedChartOptions,
      width,
      height,
    });

    // Set up resize observer
    const resizeObserver = new ResizeObserver((entries) => {
      const { width: newWidth, height: newHeight } = entries[0].contentRect;
      chartInstance.applyOptions({
        width: newWidth,
        height: newHeight,
      });
      chartInstance.timeScale().fitContent();
    });

    resizeObserver.observe(chartContainerRef.current);
    setChart(chartInstance);

    // Cleanup function
    return () => {
      resizeObserver.disconnect();
      chartInstance.remove();
      setChart(null);
    };
  }, [theme]);

  // Separate effect for handling series data
  useEffect(() => {
    if (!chart || !series.length) return;

    try {
      // Clear existing series with proper checks
      if (seriesApiRef.current.length > 0) {
        seriesApiRef.current.forEach((existingSeries) => {
          try {
            if (existingSeries && chart) {
              chart.removeSeries(existingSeries);
            }
          } catch (error) {
            console.warn("Error removing series:", error);
          }
        });
      }

      // Reset series array
      seriesApiRef.current = [];

      // Add new series with 1px line width
      series.forEach((s, index) => {
        if (!s?.data || !chart) return;

        try {
          const lineSeries = chart.addLineSeries({
            color: s.color || "#2962FF",
            title: s.name || `Series ${index}`,
            priceScaleId: "right",
            priceFormat: {
              type: "price",
              precision: 2,
              minMove: 0.01,
            },
            lineWidth: 2,
            lastValueVisible: true,
            priceLineVisible: true,
            baseLineVisible: false,
            visible: true,
          });

          if (lineSeries) {
            lineSeries.setData(s.data);
            seriesApiRef.current.push(lineSeries);
          }
        } catch (error) {
          console.warn(`Error adding series ${index}:`, error);
        }
      });

      // Fit content after adding all series
      if (chart && seriesApiRef.current.length > 0) {
        chart.timeScale().fitContent();
      }
    } catch (error) {
      console.error("Error updating chart series:", error);
    }
  }, [chart, series]);

  return (
    <div>
      {legendEnabled && <Legend series={series} />}
      <div
        id={containerId}
        ref={chartContainerRef}
        style={{
          width: "100%", // Make container responsive
          height: height,
          cursor: "crosshair",
        }}
      />
    </div>
  );
};
