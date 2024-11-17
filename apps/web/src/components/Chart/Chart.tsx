"use client";

import React, { useRef, useEffect, useState, useCallback } from "react";
import * as d3 from "d3";
import { DrawingTools } from "./DrawingTools";
import "./Chart.css";

interface ChartProps {
  data: {
    timestamp: number;
    open: number;
    high: number;
    low: number;
    close: number;
    index?: number;
  }[];
  timeframeConfig: {
    resolution: string;
    minScaleDays: number;
    maxScaleDays: number;
    tickFormat: (timestamp: number) => string;
  };
}

const Chart: React.FC<ChartProps> = ({ data, timeframeConfig }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [drawingMode, setDrawingMode] = useState<"line" | "fibonacci" | null>(
    null
  );
  const [drawingTools, setDrawingTools] = useState<DrawingTools | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startPoint, setStartPoint] = useState<[number, number] | null>(null);

  const initializeChart = useCallback(() => {
    if (!svgRef.current || !data.length) return;

    const margin = { top: 20, right: 50, bottom: 30, left: 50 };
    const width = svgRef.current.clientWidth - margin.left - margin.right;
    const height = svgRef.current.clientHeight - margin.top - margin.bottom;

    // Clear existing content
    d3.select(svgRef.current).selectAll("*").remove();

    // Calculate initial view based on desired candle width with right padding
    const calculateInitialView = () => {
      const desiredCandleWidth = 10; // Target width for each candle
      const desiredGap = 2; // Desired gap between candles
      const totalWidthPerCandle = desiredCandleWidth + desiredGap;

      // Calculate how many candles we can show in the available width
      const rightPadding = width * 0.15; // 15% of width for right padding
      const availableWidth = width - rightPadding;
      const visibleCandles = Math.floor(availableWidth / totalWidthPerCandle);

      // Get the latest timestamp
      const latestTimestamp = Math.max(...data.map((d) => d.timestamp));

      // Calculate start time to show the desired number of candles
      const startTime = new Date(latestTimestamp - visibleCandles * 60 * 1000);

      return {
        start: startTime,
        end: new Date(latestTimestamp),
        rightPadding,
      };
    };

    // Store initial view state
    const initialView = calculateInitialView();
    const xScale = d3
      .scaleTime()
      .domain([initialView.start, initialView.end])
      .range([0, width]); // Use full width

    // Calculate y-scale range based on visible candles
    const calculateYAxisRange = () => {
      // Get visible candles based on x-axis domain
      const visibleCandles = data.filter((d) => {
        const x = xScale(new Date(d.timestamp));
        return x >= 0 && x <= width;
      });

      if (visibleCandles.length === 0) return { min: 0, max: 100 };

      // Calculate min/max from visible candles only
      const yMin = d3.min(visibleCandles, (d) => d.low) as number;
      const yMax = d3.max(visibleCandles, (d) => d.high) as number;
      const yRange = yMax - yMin;

      // Add padding based on visible range
      const topPaddingPercent = 0.1; // 10% padding top
      const bottomPaddingPercent = 0.1; // 10% padding bottom

      const topPadding = yRange * topPaddingPercent;
      const bottomPadding = yRange * bottomPaddingPercent;

      return {
        min: yMin - bottomPadding,
        max: yMax + topPadding,
      };
    };

    const yAxisRange = calculateYAxisRange();
    const yScale = d3
      .scaleLinear()
      .domain([yAxisRange.min, yAxisRange.max])
      .range([height, 0])
      .nice();

    // Also update the y-axis range during x-axis scaling
    const updateYAxisRange = () => {
      const newYAxisRange = calculateYAxisRange();
      yScale.domain([newYAxisRange.min, newYAxisRange.max]).nice();
      yAxisElement.call(d3.axisRight(yScale));
      updateGrid();
    };

    // Store original domains for reference
    const originalXDomain = xScale.domain();
    const originalYDomain = yScale.domain();

    // Create main SVG
    const svg = d3
      .select(svgRef.current)
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom);

    // Create clip path with much larger boundaries (100x)
    svg
      .append("defs")
      .append("clipPath")
      .attr("id", "clip")
      .append("rect")
      .attr("x", -width * 50) // Increased to 50x left
      .attr("y", -height * 50) // Increased to 50x top
      .attr("width", width * 100) // Increased to 100x total width
      .attr("height", height * 100); // Increased to 100x total height

    // Create main container group
    const mainGroup = svg
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // Create full-width grid container first
    const gridContainer = mainGroup
      .append("g")
      .attr("class", "grid-container")
      .attr("clip-path", "url(#clip)");

    // Create grid lines for the full width
    const createGrid = () => {
      gridContainer.selectAll("*").remove();

      // Vertical grid lines (for x-axis)
      gridContainer
        .append("g")
        .attr("class", "grid x-grid")
        .attr("transform", `translate(0,${height})`)
        .call(
          d3
            .axisBottom(xScale)
            .tickSize(-height)
            .tickFormat(() => "")
        );

      // Horizontal grid lines (for y-axis)
      gridContainer
        .append("g")
        .attr("class", "grid y-grid")
        .call(
          d3
            .axisLeft(yScale)
            .tickSize(-width * 3) // Extend grid lines beyond the visible area
            .tickFormat(() => "")
        );
    };

    // Create chart area for candlesticks
    const chartArea = mainGroup
      .append("g")
      .attr("class", "chart-area")
      .attr("clip-path", "url(#clip)");

    // Create candlesticks group
    const candlestickGroup = chartArea
      .append("g")
      .attr("class", "candlesticks");

    // Initial grid creation
    createGrid();

    // Update the updateGrid function to use createGrid
    const updateGrid = () => {
      createGrid();
    };

    // Calculate initial candle width
    const calculateCandleWidth = () => {
      if (data.length < 2) return 2;

      // Get pixel distance between two consecutive candles
      const firstTimestamp = new Date(data[0].timestamp);
      const secondTimestamp = new Date(data[1].timestamp);
      const x1 = xScale(firstTimestamp);
      const x2 = xScale(secondTimestamp);
      const pixelDistance = Math.abs(x2 - x1);

      // Ensure minimum gap between candles
      const minGap = 1; // Minimum 1px gap
      const maxWidthWithGap = pixelDistance - minGap;

      // Calculate base width as a proportion of available space
      const widthProportion = 0.77; // Use 77% of available space
      let calculatedWidth = maxWidthWithGap * widthProportion;

      // Apply min/max limits
      const minWidth = 2;
      const maxWidth = Math.min(150, maxWidthWithGap); // Never exceed available space

      return Math.min(Math.max(calculatedWidth, minWidth), maxWidth);
    };

    const initialCandleWidth = calculateCandleWidth();

    // Add candlesticks to chart area with calculated width
    candlestickGroup
      .selectAll("g.candlestick")
      .data(data)
      .enter()
      .append("g")
      .attr("class", "candlestick")
      .each(function (d) {
        const g = d3.select(this);
        const className =
          d.close > d.open ? "candlestick-up" : "candlestick-down";
        const x = xScale(new Date(d.timestamp));

        // Draw the wick
        g.append("line")
          .attr("class", className)
          .attr("x1", x)
          .attr("x2", x)
          .attr("y1", yScale(d.high))
          .attr("y2", yScale(d.low))
          .attr("stroke-width", 1);

        // Draw the body with calculated width
        g.append("rect")
          .attr("class", className)
          .attr("x", x - initialCandleWidth / 2)
          .attr("y", yScale(Math.max(d.open, d.close)))
          .attr("width", initialCandleWidth)
          .attr("height", Math.abs(yScale(d.open) - yScale(d.close)));
      });

    // Create axes groups with backgrounds
    const xAxisGroup = mainGroup
      .append("g")
      .attr("class", "x-axis-group")
      .attr("transform", `translate(0,${height})`);

    const yAxisGroup = mainGroup
      .append("g")
      .attr("class", "y-axis-group")
      .attr("transform", `translate(${width},0)`);

    // Create axes with proper date formatting
    const xAxis = d3
      .axisBottom(xScale)
      .ticks(width / 80)
      .tickFormat((d: Date) => {
        // Format date based on visible range
        const domain = xScale.domain();
        const timeRange = domain[1].getTime() - domain[0].getTime();
        const daysVisible = timeRange / (24 * 60 * 60 * 1000);

        if (daysVisible > 365) {
          return d3.timeFormat("%Y")(d); // Show year only
        } else if (daysVisible > 60) {
          return d3.timeFormat("%b %Y")(d); // Show month and year
        } else if (daysVisible > 7) {
          return d3.timeFormat("%b %d")(d); // Show month and day
        } else {
          return d3.timeFormat("%b %d %H:%M")(d); // Show full date and time
        }
      })
      .tickSizeOuter(0);

    const yAxis = d3
      .axisRight(yScale)
      .ticks(height / 50)
      .tickSizeOuter(0);

    // Add backgrounds
    xAxisGroup
      .append("rect")
      .attr("class", "axis-background")
      .attr("x", -margin.left)
      .attr("y", 0)
      .attr("width", width + margin.left + margin.right)
      .attr("height", margin.bottom + 5);

    yAxisGroup
      .append("rect")
      .attr("class", "axis-background")
      .attr("x", 0)
      .attr("y", -margin.top)
      .attr("width", margin.right + 5)
      .attr("height", height + margin.top + margin.bottom);

    // Add the actual axes
    const xAxisElement = xAxisGroup
      .append("g")
      .attr("class", "x-axis")
      .call(xAxis);

    const yAxisElement = yAxisGroup
      .append("g")
      .attr("class", "y-axis")
      .call(yAxis);

    // Update zoom behavior
    const zoom = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([1, 1])
      .extent([
        [0, 0],
        [width, height],
      ])
      .translateExtent([
        [-width * 50, -height * 50],
        [width * 51, height * 51],
      ])
      .on("zoom", (event) => {
        if (drawingMode) return;

        const transform = event.transform;

        // Update chart area and grid container
        chartArea.attr("transform", `translate(${transform.x},${transform.y})`);
        gridContainer.attr(
          "transform",
          `translate(${transform.x},${transform.y})`
        );

        // Calculate visible range using the latest data point as reference
        const latestDate = new Date(Math.max(...data.map((d) => d.timestamp)));
        const xRange = [0, width].map((d) => transform.invertX(d));
        const newXScale = xScale.copy();
        const timeRange =
          xScale.invert(xRange[1]).getTime() -
          xScale.invert(xRange[0]).getTime();

        newXScale.domain([
          new Date(latestDate.getTime() - timeRange),
          latestDate,
        ]);

        const yRange = [height, 0].map((d) => transform.invertY(d));
        const newYScale = yScale
          .copy()
          .domain(yRange.map((d) => yScale.invert(d)));

        // Update axes
        xAxisElement.call(d3.axisBottom(newXScale) as any);
        yAxisElement.call(d3.axisRight(newYScale) as any);

        // Update grid
        updateGrid();
      });

    // Update x-axis interaction handler
    xAxisGroup
      .append("rect")
      .attr("class", "x-axis-interaction")
      .attr("x", -margin.left)
      .attr("y", -5)
      .attr("width", width + margin.left + margin.right)
      .attr("height", margin.bottom + 10)
      .attr("fill", "transparent")
      .style("cursor", "ew-resize")
      .call(
        d3.drag<SVGRectElement, unknown>().on("drag", (event) => {
          if (drawingMode) return;

          // Get current transform and domain
          const transform = d3.zoomTransform(svg.node() as any);
          const currentDomain = xScale.domain() as [Date, Date];
          const latestDate = new Date(
            Math.max(...data.map((d) => d.timestamp))
          );

          // Increased sensitivity for more aggressive scaling
          const sensitivity =
            timeframeConfig.resolution === "1" ? 0.004 : 0.006; // Doubled sensitivity
          const scaleDelta = 1 + event.dx * sensitivity;

          // Calculate new range
          const timeRange =
            currentDomain[1].getTime() - currentDomain[0].getTime();
          const newTimeRange = timeRange * scaleDelta;

          // Greatly relaxed scaling limits
          const msPerDay = 24 * 60 * 60 * 1000;
          const daysVisible = newTimeRange / msPerDay;
          const minDays = timeframeConfig.resolution === "1" ? 0.01 : 0.02; // Allow much more zoom in
          const maxDays = timeframeConfig.resolution === "1" ? 300 : 3650; // Allow much more zoom out

          if (daysVisible < minDays || daysVisible > maxDays) {
            return;
          }

          // Reduced minimum candle spacing for extreme zoom
          const minCandleSpacing = 0.5; // Reduced from 1 to 0.5
          const candlesInView = data.length;
          const pixelsPerCandle = width / (candlesInView * scaleDelta);

          if (pixelsPerCandle < minCandleSpacing) {
            return;
          }

          // Update scale with new domain, keeping latest date fixed
          xScale.domain([
            new Date(latestDate.getTime() - newTimeRange),
            latestDate,
          ]);

          // Calculate candle width based on actual pixel distance with better spacing
          const calculateCandleWidth = () => {
            const visibleCandles = data.filter((d) => {
              const x = xScale(new Date(d.timestamp));
              return x >= 0 && x <= width;
            });

            if (visibleCandles.length < 2) return 2;

            // Get pixel distance between two consecutive candles
            const firstCandle = visibleCandles[0];
            const secondCandle = visibleCandles[1];
            const x1 = xScale(new Date(firstCandle.timestamp));
            const x2 = xScale(new Date(secondCandle.timestamp));
            const pixelDistance = Math.abs(x2 - x1);

            // Ensure minimum gap between candles
            const minGap = 1; // Minimum 1px gap
            const maxWidthWithGap = pixelDistance - minGap;

            // Calculate base width as a proportion of available space
            const widthProportion = 0.77; // Use 70% of available space
            let calculatedWidth = maxWidthWithGap * widthProportion;

            // Apply min/max limits
            const minWidth = 2;
            const maxWidth = Math.min(150, maxWidthWithGap); // Never exceed available space

            return Math.min(Math.max(calculatedWidth, minWidth), maxWidth);
          };

          const candleWidth = calculateCandleWidth();

          // Update candlesticks with new width
          candlestickGroup.selectAll("g.candlestick").each(function (d: any) {
            const g = d3.select(this);
            const timestamp = new Date(d.timestamp);
            const x = xScale(timestamp);

            if (x >= -width * 2 && x <= width * 3) {
              g.style("display", "block")
                .transition()
                .duration(50)
                .ease(d3.easeLinear);

              g.select("line")
                .attr("x1", x)
                .attr("x2", x)
                .attr("stroke-width", 1);

              g.select("rect")
                .attr("x", x - candleWidth / 2)
                .attr("width", candleWidth);
            } else {
              g.style("display", "none");
            }
          });

          // Update x-axis with timeframe-specific formatting
          xAxisElement.call(
            d3
              .axisBottom(xScale)
              .ticks(width / 80)
              .tickFormat((d: any) => timeframeConfig.tickFormat(d.getTime()))
              .tickSizeOuter(0)
          );

          // Update grid
          updateGrid();

          // Update y-axis range based on visible candles with proper gaps
          const updateYAxisRangeWithGaps = () => {
            // Get only visible candles
            const visibleCandles = data.filter((d) => {
              const x = xScale(new Date(d.timestamp));
              return x >= 0 && x <= width;
            });

            if (visibleCandles.length === 0) return;

            // Calculate min/max from visible candles
            const yMin = d3.min(visibleCandles, (d) => d.low) as number;
            const yMax = d3.max(visibleCandles, (d) => d.high) as number;
            const yRange = yMax - yMin;

            // Calculate padding based on price range
            const topPaddingPercent = 0.1; // 10% padding top
            const bottomPaddingPercent = 0.1; // 10% padding bottom

            const topPadding = yRange * topPaddingPercent;
            const bottomPadding = yRange * bottomPaddingPercent;

            // Update y-scale with new range
            yScale.domain([yMin - bottomPadding, yMax + topPadding]).nice();

            // Update y-axis
            yAxisElement.call(d3.axisRight(yScale));

            // Update candlesticks
            candlestickGroup.selectAll("g.candlestick").each(function (d: any) {
              const g = d3.select(this);

              // Update wick position
              g.select("line")
                .attr("y1", yScale(d.high))
                .attr("y2", yScale(d.low));

              // Update body position
              g.select("rect")
                .attr("y", yScale(Math.max(d.open, d.close)))
                .attr("height", Math.abs(yScale(d.open) - yScale(d.close)));
            });

            // Update grid
            updateGrid();
          };

          // Call the new function after updating x-axis
          updateYAxisRangeWithGaps();
        })
      );

    // Update y-axis interaction handler for matching scale range
    yAxisGroup
      .append("rect")
      .attr("class", "y-axis-interaction")
      .attr("x", -5)
      .attr("y", -margin.top)
      .attr("width", margin.right + 10)
      .attr("height", height + margin.top + margin.bottom)
      .attr("fill", "transparent")
      .style("cursor", "ns-resize")
      .call(
        d3.drag<SVGRectElement, unknown>().on("drag", (event) => {
          if (drawingMode) return;

          // Get current domain and range
          const domain = yScale.domain();
          const domainRange = domain[1] - domain[0];
          const centerPrice = (domain[0] + domain[1]) / 2;

          // Increased sensitivity for y-axis
          const scaleDelta = 1 + event.dy * 0.004; // Doubled sensitivity

          // Calculate new range
          const newRange = domainRange * scaleDelta;
          const halfNewRange = newRange / 2;

          // Calculate new domain keeping center fixed
          const newMin = centerPrice - halfNewRange;
          const newMax = centerPrice + halfNewRange;

          // Greatly relaxed scaling limits
          const originalRange = originalYDomain[1] - originalYDomain[0];
          const minRange = originalRange * 0.01; // 1% of original range (was 10%)
          const maxRange = originalRange * 100; // 10000% of original range (was 1000%)

          if (newRange < minRange || newRange > maxRange) {
            return;
          }

          // Update scale with new domain
          yScale.domain([newMin, newMax]);

          // Update candlesticks
          candlestickGroup.selectAll("g.candlestick").each(function (d: any) {
            const g = d3.select(this);

            // Update wick position
            g.select("line")
              .attr("y1", yScale(d.high))
              .attr("y2", yScale(d.low));

            // Update body position
            g.select("rect")
              .attr("y", yScale(Math.max(d.open, d.close)))
              .attr("height", Math.abs(yScale(d.open) - yScale(d.close)));
          });

          // Update y-axis
          yAxisElement.call(d3.axisRight(yScale));

          // Update grid
          updateGrid();
        })
      );

    // Apply zoom behavior with initial transform to create right padding
    svg
      .call(zoom as any)
      .call(
        zoom.transform as any,
        d3.zoomIdentity.translate(-initialView.rightPadding, 0)
      )
      .on("dblclick.zoom", null);

    // Apply margin transform to mainGroup
    mainGroup.attr("transform", `translate(${margin.left},${margin.top})`);
  }, [data, drawingMode, timeframeConfig]);

  useEffect(() => {
    initializeChart();

    const handleResize = () => {
      initializeChart();
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [data, initializeChart]);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (!drawingMode || !drawingTools) return;

      const svg = svgRef.current;
      if (!svg) return;

      const point = d3.pointer(e.nativeEvent, svg);
      setStartPoint(point);
      setIsDragging(true);
    },
    [drawingMode, drawingTools]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isDragging || !startPoint || !drawingTools || !drawingMode) return;

      const svg = svgRef.current;
      if (!svg) return;

      const currentPoint = d3.pointer(e.nativeEvent, svg);

      // Clear previous temporary drawing
      d3.select(svg).selectAll(".temp-drawing").remove();

      if (drawingMode === "line") {
        drawingTools.drawLine(startPoint, currentPoint, true);
      } else if (drawingMode === "fibonacci") {
        drawingTools.drawFibonacci(startPoint, currentPoint, true);
      }
    },
    [isDragging, startPoint, drawingTools, drawingMode]
  );

  const handleMouseUp = useCallback(
    (e: React.MouseEvent) => {
      if (!isDragging || !startPoint || !drawingTools || !drawingMode) return;

      const svg = svgRef.current;
      if (!svg) return;

      const endPoint = d3.pointer(e.nativeEvent, svg);

      // Remove temporary drawing
      d3.select(svg).selectAll(".temp-drawing").remove();

      // Create permanent drawing
      if (drawingMode === "line") {
        drawingTools.drawLine(startPoint, endPoint);
      } else if (drawingMode === "fibonacci") {
        drawingTools.drawFibonacci(startPoint, endPoint);
      }

      setIsDragging(false);
      setStartPoint(null);
    },
    [isDragging, startPoint, drawingTools, drawingMode]
  );

  return (
    <div className="chart-container">
      <div className="toolbar">
        <button
          onClick={() => setDrawingMode("line")}
          className={drawingMode === "line" ? "active" : ""}
        >
          Line Tool
        </button>
        <button
          onClick={() => setDrawingMode("fibonacci")}
          className={drawingMode === "fibonacci" ? "active" : ""}
        >
          Fibonacci Tool
        </button>
        <button onClick={() => setDrawingMode(null)}>Select</button>
      </div>
      <svg
        ref={svgRef}
        className="chart"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={() => {
          setIsDragging(false);
          setStartPoint(null);
        }}
      />
    </div>
  );
};

export default Chart;
