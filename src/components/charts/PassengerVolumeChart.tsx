import * as d3 from "d3";
import { useEffect, useRef } from "react";

export default function PassengerVolumeChart({ passengers = [] }: { passengers?: number[] }) {
  const ref = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    const svg = d3.select(ref.current);
    svg.selectAll("*").remove();

    // If no data, exit early
    if (!passengers || passengers.length === 0) {
      svg
        .append("text")
        .attr("x", "50%")
        .attr("y", "50%")
        .attr("text-anchor", "middle")
        .attr("fill", "#555")
        .text("No data available");
      return;
    }

    const width = 260;
    const height = 150;
    const margin = { top: 10, right: 10, bottom: 25, left: 35 };
    svg.attr("viewBox", `0 0 ${width} ${height}`);

    // Scales
    const x = d3
      .scaleLinear()
      .domain([0, passengers.length - 1])
      .range([margin.left, width - margin.right]);

    const y = d3
      .scaleLinear()
      .domain([0, d3.max(passengers)])
      .nice()
      .range([height - margin.bottom, margin.top]);

    // Line
    const line = d3
      .line()
      .x((_d: number, i: number) => x(i))
      .y((d: number) => y(d))
      .curve(d3.curveCatmullRom.alpha(0.5));

    const path = svg
      .append("path")
      .datum(passengers)
      .attr("fill", "none")
      .attr("stroke", "#00ffff")
      .attr("stroke-width", 2)
      .attr("d", line as unknown as string);

    // Animate using path length measured from the DOM node
    const node = path.node() as SVGPathElement | null;
    if (node) {
      const length = node.getTotalLength();
  // stroke-dashoffset expects a string/number; ensure it's a number here
  path.attr("stroke-dasharray", `${length} ${length}`).attr("stroke-dashoffset", length as number).transition().duration(1000).attr("stroke-dashoffset", 0);
    }

    // Circles
    svg
      .selectAll("circle")
      .data(passengers)
      .enter()
      .append("circle")
      .attr("cx", (_d: number, i: number) => x(i))
      .attr("cy", (d: number) => y(d))
      .attr("r", 3)
      .attr("fill", "#00ffff");

    // Axes
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    svg
      .append("g")
      .attr("transform", `translate(0,${height - margin.bottom})`)
      .call(d3.axisBottom(x).ticks(11).tickFormat((_: number, i: number) => months[i] || ""))
      .selectAll("text")
      .attr("font-size", "8px")
      .attr("fill", "#aaa");

    svg
      .append("g")
      .attr("transform", `translate(${margin.left},0)`)
      .call(d3.axisLeft(y).ticks(4))
      .selectAll("text")
      .attr("font-size", "8px")
      .attr("fill", "#aaa");
  }, [passengers]);

  return (
    <div className="w-full flex flex-col items-center">
      <svg ref={ref} className="w-full h-36" />
      <p className="text-gray-400 text-xs mt-1">Passengers (millions)</p>
    </div>
  );
}
