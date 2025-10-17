import * as d3 from "d3";
import { useEffect, useRef } from "react";
import sampleData from "../data/sample_flights.json";

export default function Chart() {
  const ref = useRef();

  useEffect(() => {
    const svg = d3.select(ref.current);
    const airlines = d3.rollups(sampleData, v => v.length, d => d.airline);
    const width = 300, height = 200;

    const x = d3.scaleBand().domain(airlines.map(d => d[0])).range([0, width]).padding(0.1);
    const y = d3.scaleLinear().domain([0, d3.max(airlines, d => d[1])]).nice().range([height, 0]);

    svg.selectAll("rect")
      .data(airlines)
      .join("rect")
      .attr("x", d => x(d[0]))
      .attr("y", d => y(d[1]))
      .attr("width", x.bandwidth())
      .attr("height", d => height - y(d[1]))
      .attr("fill", "#00ffff")
      .on("mouseover", (event, d) => console.log("Hover:", d));

    svg.selectAll(".x-axis").data([0]).join("g").attr("transform", `translate(0,${height})`).call(d3.axisBottom(x).tickSizeOuter(0));
    svg.selectAll(".y-axis").data([0]).join("g").call(d3.axisLeft(y));
  }, []);

  return <svg ref={ref} width={340} height={240}></svg>;
}