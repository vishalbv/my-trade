import { createChart, ColorType } from "lightweight-charts";
import React, { useEffect, useRef } from "react";

interface ChartProps {
  data: {
    time: string;
    value: number;
  }[];
  colors?: {
    backgroundColor?: string;
    lineColor?: string;
    textColor?: string;
    areaTopColor?: string;
    areaBottomColor?: string;
  };
}

export const MultiLineChart: React.FC<ChartProps> = ({ data, colors = {} }) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: {
          type: ColorType.Solid,
          color: colors.backgroundColor || "white",
        },
        textColor: colors.textColor || "black",
      },
      width: chartContainerRef.current.clientWidth,
      height: 400,
      grid: {
        vertLines: {
          visible: false,
        },
        horzLines: {
          visible: false,
        },
      },
    });

    // Add line series
    const lineSeries = chart.addLineSeries({
      color: colors.lineColor || "#2962FF",
      lineWidth: 2,
    });

    lineSeries.setData(data);

    // Handle resizing
    const handleResize = () => {
      if (chartContainerRef.current) {
        chart.applyOptions({
          width: chartContainerRef.current.clientWidth,
        });
      }
    };

    window.addEventListener("resize", handleResize);

    // Enable zooming and scaling
    chart.timeScale().fitContent();

    // Enable scrolling
    chart.timeScale().applyOptions({
      rightOffset: 12,
      barSpacing: 3,
      lockVisibleTimeRangeOnResize: true,
      rightBarStaysOnScroll: true,
      borderVisible: false,
      borderColor: "#fff000",
      visible: true,
      timeVisible: true,
      secondsVisible: false,
    });

    return () => {
      chart.remove();
      window.removeEventListener("resize", handleResize);
    };
  }, [data, colors]);

  return <div ref={chartContainerRef} />;
};
