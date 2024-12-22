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

  useEffect(() => {
    if (!chartContainerRef.current) return;

    const currentTheme = themes[theme as keyof typeof themes] || themes.light;

    const chartOptions: DeepPartial<ChartOptions> = {
      layout: {
        textColor: currentTheme.text,
        background: {
          type: "solid",
          color: currentTheme.background,
        },
        fontFamily: CHART_FONT_FAMILY,
      },
      width,
      height,
      grid: {
        vertLines: {
          visible: true,
          color: currentTheme.grid,
        },
        horzLines: {
          visible: true,
          color: currentTheme.grid,
        },
      },
      timeScale: {
        timeVisible: true,
        secondsVisible: false,
        borderColor: currentTheme.grid,
        borderVisible: true,
        visible: true,
      },
      rightPriceScale: {
        borderColor: currentTheme.grid,
        borderVisible: true,
        visible: true,
        textColor: currentTheme.text,
      },
      crosshair: {
        mode: 1,
        vertLine: {
          visible: true,
          labelVisible: true,
          color: currentTheme.crosshair,
          labelBackgroundColor: currentTheme.controlsBackground,
          style: 2,
        },
        horzLine: {
          visible: true,
          labelVisible: true,
          color: currentTheme.crosshair,
          labelBackgroundColor: currentTheme.controlsBackground,
          style: 2,
        },
      },
    };

    const chartInstance = createChart(chartContainerRef.current, chartOptions);

    // Only format price in crosshair
    chartInstance.applyOptions({
      crosshair: {
        vertLine: {
          visible: true,
          labelVisible: true,
          color: currentTheme.crosshair,
          labelBackgroundColor: currentTheme.controlsBackground,
          style: 2,
        },
        horzLine: {
          visible: true,
          labelVisible: true,
          color: currentTheme.crosshair,
          labelBackgroundColor: currentTheme.controlsBackground,
          style: 2,
          labelFormatter: (price: number) => price.toFixed(2),
        },
      },
    });

    setChart(chartInstance);

    return () => {
      chartInstance.remove();
    };
  }, [width, height, theme]);

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
      console.error("Error updating chart:", error);
    }
  }, [chart, series]);

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
