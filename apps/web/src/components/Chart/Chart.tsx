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
  }[];
}

const Chart: React.FC<ChartProps> = ({ data }) => {
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

    // Create scales with proper initial view
    const xScale = d3
      .scaleTime()
      .domain(d3.extent(data, (d) => new Date(d.timestamp)) as [Date, Date])
      .range([0, width]);

    // Get the actual data domain with type safety
    const [minDate, maxDate] = d3.extent(
      data,
      (d) => new Date(d.timestamp)
    ) as [Date, Date];
    const dataTimeRange = maxDate.getTime() - minDate.getTime();

    // Add padding to the time range (20% on each side)
    const timeRangePadding = dataTimeRange * 0.2;
    const paddedMinDate = new Date(minDate.getTime() - timeRangePadding);
    const paddedMaxDate = new Date(maxDate.getTime() + timeRangePadding);

    // Set initial domain with padding
    xScale.domain([paddedMinDate, paddedMaxDate]);

    // Calculate y-scale domain with proper padding
    const yMin = d3.min(data, (d) => d.low) as number;
    const yMax = d3.max(data, (d) => d.high) as number;
    const yRange = yMax - yMin;
    const yPadding = yRange * 0.2; // 20% padding

    const yScale = d3
      .scaleLinear()
      .domain([yMin - yPadding, yMax + yPadding])
      .range([height, 0]);

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

    // Add candlesticks to chart area first (so they appear behind axes)
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

        // Draw the wick
        g.append("line")
          .attr("class", className)
          .attr("x1", () => xScale(new Date(d.timestamp)))
          .attr("x2", () => xScale(new Date(d.timestamp)))
          .attr("y1", () => yScale(d.high))
          .attr("y2", () => yScale(d.low));

        // Draw the body
        g.append("rect")
          .attr("class", className)
          .attr("x", () => xScale(new Date(d.timestamp)) - 3)
          .attr("y", () => yScale(Math.max(d.open, d.close)))
          .attr("width", 6)
          .attr("height", () => Math.abs(yScale(d.open) - yScale(d.close)));
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

          // Calculate scale change with reduced sensitivity
          const scaleDelta = 1 + event.dx * 0.001;

          // Calculate new range
          const timeRange =
            currentDomain[1].getTime() - currentDomain[0].getTime();
          const newTimeRange = timeRange * scaleDelta;

          // Apply scaling limits
          const msPerDay = 24 * 60 * 60 * 1000;
          const daysVisible = newTimeRange / msPerDay;
          const minDays = 5;
          const maxDays = 200;

          if (daysVisible < minDays || daysVisible > maxDays) {
            return;
          }

          // Update scale with new domain, keeping latest date fixed
          xScale.domain([
            new Date(latestDate.getTime() - newTimeRange),
            latestDate,
          ]);

          // Update candlesticks with improved positioning and visibility check
          candlestickGroup.selectAll("g.candlestick").each(function (d: any) {
            const g = d3.select(this);
            const timestamp = new Date(d.timestamp);
            const x = xScale(timestamp);

            // Calculate spacing based on current scale
            const nextTimestamp = new Date(
              timestamp.getTime() + 24 * 60 * 60 * 1000
            );
            const nextX = xScale(nextTimestamp);
            const availableSpace = Math.abs(nextX - x);

            // Adjust candle width with better proportions
            const candleWidth = Math.min(
              Math.max(availableSpace * 0.8, 3), // 80% of available space, min 3px
              25 // max width 25px
            );

            // Extended visibility check range (increased buffer zone)
            if (x >= -width * 2 && x <= width * 3) {
              // Much larger visibility range
              g.style("display", "block");

              // Update wick with fixed width
              g.select("line")
                .attr("x1", x)
                .attr("x2", x)
                .attr("stroke-width", 1);

              // Update body with centered position
              g.select("rect")
                .attr("x", x - candleWidth / 2)
                .attr("width", candleWidth);
            } else {
              g.style("display", "none");
            }
          });

          // Update x-axis with proper date formatting in drag handler
          xAxisElement.call(
            d3
              .axisBottom(xScale)
              .ticks(width / 80)
              .tickFormat((d: Date) => {
                const domain = xScale.domain();
                const timeRange = domain[1].getTime() - domain[0].getTime();
                const daysVisible = timeRange / (24 * 60 * 60 * 1000);

                if (daysVisible > 365) {
                  return d3.timeFormat("%Y")(d);
                } else if (daysVisible > 60) {
                  return d3.timeFormat("%b %Y")(d);
                } else if (daysVisible > 7) {
                  return d3.timeFormat("%b %d")(d);
                } else {
                  return d3.timeFormat("%b %d %H:%M")(d);
                }
              })
              .tickSizeOuter(0)
          );

          // Update grid
          gridContainer.selectAll(".x-grid").call(
            d3
              .axisBottom(xScale)
              .tickSize(-height)
              .tickFormat(() => "")
          );

          gridContainer.selectAll(".y-grid").call(
            d3
              .axisLeft(yScale)
              .tickSize(-width * 3)
              .tickFormat(() => "")
          );
        })
      );

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

          // Get current domain
          const domain = yScale.domain();
          const domainRange = domain[1] - domain[0];

          // Calculate scale change with reversed direction
          const scaleDelta = 1 + event.dy * 0.002;

          // Calculate new range while keeping center fixed
          const newRange = domainRange * scaleDelta;
          const centerPrice = (domain[0] + domain[1]) / 2;
          const halfNewRange = newRange / 2;

          // Apply minimum and maximum scaling limits
          const pricePerPixel = newRange / height;
          const minPricePerPixel = 0.1; // Minimum price variation per pixel
          const maxPricePerPixel = 100; // Maximum price variation per pixel

          if (
            pricePerPixel < minPricePerPixel || // Too expanded
            pricePerPixel > maxPricePerPixel // Too compressed
          ) {
            return;
          }

          // Update scale with new domain
          yScale.domain([
            centerPrice - halfNewRange,
            centerPrice + halfNewRange,
          ]);

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
          yAxisElement.call(d3.axisRight(yScale) as any);

          // Update grid
          updateGrid();
        })
      );

    // Apply zoom behavior with fixed initial transform
    svg
      .call(zoom as any)
      .call(
        zoom.transform as any,
        d3.zoomIdentity.translate(margin.left, margin.top)
      )
      .on("dblclick.zoom", null);
  }, [data, drawingMode]);

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
