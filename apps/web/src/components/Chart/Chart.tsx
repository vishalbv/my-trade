"use client";

import React, { useRef, useEffect, useState, useCallback } from "react";
import * as d3 from "d3";
import { DrawingTools } from "./DrawingTools";
import "./Chart.css";
import { OHLCData } from "./types";

interface ChartProps {
  data: OHLCData[];
  timeframeConfig: {
    resolution: string;
    minScaleDays: number;
    maxScaleDays: number;
    tickFormat: (timestamp: number) => string;
  };
}

const Chart: React.FC<ChartProps> = ({ data, timeframeConfig }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas size with device pixel ratio for sharp rendering
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();

    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;

    ctx.scale(dpr, dpr);

    // Clear previous render
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Example candlestick rendering
    const drawCandle = (ohlc: OHLCData, x: number, width: number) => {
      const { open, high, low, close } = ohlc;

      // Calculate y coordinates based on price scale
      // This is simplified - you'll need proper scaling logic
      const y1 = high;
      const y2 = low;

      ctx.beginPath();
      ctx.strokeStyle = close > open ? "#26a69a" : "#ef5350";
      ctx.fillStyle = close > open ? "#26a69a" : "#ef5350";

      // Draw candle body
      ctx.fillRect(x, open, width, close - open);

      // Draw wicks
      ctx.moveTo(x + width / 2, y1);
      ctx.lineTo(x + width / 2, y2);
      ctx.stroke();
    };

    // Render all candles
    // Add proper scaling and positioning logic
    data.forEach((candle, i) => {
      drawCandle(candle, i * 10, 8);
    });
  }, [data, timeframeConfig]);

  return <canvas ref={canvasRef} style={{ width: "100%", height: "100%" }} />;
};

export default Chart;
