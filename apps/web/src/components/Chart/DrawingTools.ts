import * as d3 from "d3";

export class DrawingTools {
  private svg: d3.Selection<SVGGElement, unknown, null, undefined>;
  private xScale: d3.ScaleTime<number, number>;
  private yScale: d3.ScaleLinear<number, number>;

  constructor(
    svg: d3.Selection<SVGGElement, unknown, null, undefined>,
    xScale: d3.ScaleTime<number, number>,
    yScale: d3.ScaleLinear<number, number>
  ) {
    this.svg = svg;
    this.xScale = xScale;
    this.yScale = yScale;
  }

  drawLine(
    startPoint: [number, number],
    endPoint: [number, number],
    isTemporary = false
  ) {
    this.svg
      .append("line")
      .attr("class", isTemporary ? "temp-drawing" : "drawing")
      .attr("x1", startPoint[0])
      .attr("y1", startPoint[1])
      .attr("x2", endPoint[0])
      .attr("y2", endPoint[1])
      .attr("stroke", "white")
      .attr("stroke-width", 1);
  }

  drawFibonacci(
    startPoint: [number, number],
    endPoint: [number, number],
    isTemporary = false
  ) {
    const fibLevels = [0, 0.236, 0.382, 0.5, 0.618, 0.786, 1];
    const priceRange = endPoint[1] - startPoint[1];
    const group = this.svg
      .append("g")
      .attr("class", isTemporary ? "temp-drawing" : "drawing");

    fibLevels.forEach((level) => {
      const y = startPoint[1] + priceRange * level;
      group
        .append("line")
        .attr("x1", startPoint[0])
        .attr("x2", endPoint[0])
        .attr("y1", y)
        .attr("y2", y)
        .attr("stroke", "#4a9eff")
        .attr("stroke-width", 1)
        .attr("stroke-dasharray", "3,3");

      group
        .append("text")
        .attr("x", endPoint[0] + 5)
        .attr("y", y)
        .attr("fill", "#4a9eff")
        .text(`${(level * 100).toFixed(1)}%`);
    });
  }
}
