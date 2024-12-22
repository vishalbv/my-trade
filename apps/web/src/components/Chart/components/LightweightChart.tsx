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
}

export const LightweightChart: React.FC<LightweightChartProps> = ({
  containerId = "lightweight-chart",
  width = 800,
  height = 400,
  series,
}) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const [chart, setChart] = useState<IChartApi | null>(null);
  const seriesApiRef = useRef<ISeriesApi<"Line">[]>([]);
  const { theme } = useTheme();

  // Effect for chart initialization and cleanup
  useEffect(() => {
    if (!chartContainerRef.current) return;

    const currentTheme = themes[theme as keyof typeof themes] || themes.light;

    // Define chart options with theme colors
    const themedChartOptions: DeepPartial<ChartOptions> = {
      layout: {
        background: { color: "transparent" },
        textColor: currentTheme.text,
        fontFamily: CHART_FONT_FAMILY,
      },
      grid: {
        vertLines: { color: currentTheme.grid },
        horzLines: { color: currentTheme.grid },
      },
      timeScale: {
        borderColor: currentTheme.grid,
        timeVisible: true,
        secondsVisible: false,
      },
      crosshair: {
        vertLine: {
          color: currentTheme.crosshair,
          style: LineStyle.Dashed,
        },
        horzLine: {
          color: currentTheme.crosshair,
          style: LineStyle.Dashed,
        },
      },
      rightPriceScale: {
        borderColor: currentTheme.text,
      },
      handleScroll: {
        mouseWheel: true,
        pressedMouseMove: true,
      },
      handleScale: {
        mouseWheel: true,
        pinch: true,
      },
    };

    const chartInstance = createChart(chartContainerRef.current, {
      ...themedChartOptions,
      width,
      height,
    });

    setChart(chartInstance);

    // Create ResizeObserver for smooth resizing
    const resizeObserver = new ResizeObserver((entries) => {
      if (!chartInstance) return;

      const { width: newWidth, height: newHeight } = entries[0].contentRect;

      try {
        chartInstance.applyOptions({
          width: newWidth,
          height: newHeight,
        });
        chartInstance.timeScale().fitContent();
      } catch (error) {
        console.error("Error resizing chart:", error);
      }
    });

    // Start observing the container
    resizeObserver.observe(chartContainerRef.current);

    return () => {
      resizeObserver.disconnect();
      chartInstance.remove();
    };
  }, [theme]); // Only recreate when theme changes

  // Effect for handling series data
  useEffect(() => {
    if (!chart) return;

    try {
      // Clear existing series
      seriesApiRef.current.forEach((existingSeries) => {
        if (existingSeries && chart) {
          try {
            chart.removeSeries(existingSeries);
          } catch (error) {
            console.warn("Error removing series:", error);
          }
        }
      });
      seriesApiRef.current = [];

      // Create series with individual scales
      series.forEach((s, index) => {
        if (!s?.data || !chart) return;

        try {
          const lineSeries = chart.addLineSeries({
            color: s.color || "#2962FF",
            title: s.name || `Series ${index}`,
            priceScaleId: s.priceScaleId || `scale_${index}`,
            priceFormat: {
              type: "price",
              precision: 2,
              minMove: 0.01,
            },
          });

          if (lineSeries) {
            lineSeries.setData(
              s.data.map((d) => ({
                time: d.time as Time,
                value: d.value,
              }))
            );
            seriesApiRef.current.push(lineSeries);
          }
        } catch (error) {
          console.warn(`Error adding series ${index}:`, error);
        }
      });

      // Fit content if we have any series
      if (seriesApiRef.current.length > 0) {
        chart.timeScale().fitContent();
      }
    } catch (error) {
      console.error("Error updating series:", error);
    }
  }, [chart, series]); // Only update when chart or series changes

  return (
    <div>
      <Legend series={series} />
      <div
        id={containerId}
        ref={chartContainerRef}
        style={{
          width: width,
          height: height,
        }}
      />
    </div>
  );
};
