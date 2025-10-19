import * as d3 from "d3";
import { useEffect, useRef } from "react";

export default function DestinationDonutChart({ destinations }) {
  const ref = useRef();

  useEffect(() => {
    if (!destinations || destinations.length === 0) return;
    const svg = d3.select(ref.current);
    svg.selectAll("*").remove();

    const width = 240;
    const height = 200;
    const radius = Math.min(width, height) / 2 - 10;

    svg.attr("viewBox", `0 0 ${width} ${height}`);
    const g = svg
      .append("g")
      .attr("transform", `translate(${width / 2},${height / 2})`);

    // Fake numeric data (counts per destination)
    const data = Object.fromEntries(
      destinations.map((dest) => [dest, Math.floor(Math.random() * 100 + 20)])
    );

    const color = d3.scaleOrdinal()
      .domain(Object.keys(data))
      .range(["#00ffff", "#00ccff", "#0099ff", "#3366ff", "#6633ff"]);

    const pie = d3.pie().value((d) => d[1]);
    const arc = d3.arc().innerRadius(radius * 0.6).outerRadius(radius);

    const arcs = g.selectAll("arc")
      .data(pie(Object.entries(data)))
      .enter()
      .append("g");

    arcs
      .append("path")
      .attr("d", arc)
      .attr("fill", (d) => color(d.data[0]))
      .attr("stroke", "#0a0a0a")
      .style("stroke-width", "1px")
      .style("opacity", 0.9);

    // Labels
    const labelArc = d3.arc().innerRadius(radius * 0.7).outerRadius(radius * 1.1);

    arcs
      .append("text")
      .attr("transform", (d) => `translate(${labelArc.centroid(d)})`)
      .attr("text-anchor", "middle")
      .attr("fill", "white")
      .attr("font-size", "10px")
      .text((d) => d.data[0]);
  }, [destinations]);

  return (
    <div className="w-full flex flex-col items-center mt-3">
      <svg ref={ref} className="w-full h-48" />
      <p className="text-gray-400 text-xs mt-1">Top destinations</p>
    </div>
  );
}
