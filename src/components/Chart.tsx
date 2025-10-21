import * as d3 from "d3";
import { scaleBand } from "d3-scale";
import { useEffect, useRef } from "react";
import sampleData from "../../public/data/sample_flights.json";

type SampleFlight = {
  airline?: string;
};

export default function Chart() {
  const ref = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    const svg = d3.select(ref.current as unknown as SVGSVGElement);
    const data = (sampleData as unknown) as SampleFlight[];

  // rollups result: [key, count][]
  const airlinesRaw = d3.rollups(data as unknown as SampleFlight[], (v: SampleFlight[]) => v.length, (d: SampleFlight) => d.airline || "Unknown");
  const airlines = airlinesRaw as [string, number][];
    const width = 300;
    const height = 200;

  type RollupItem = [string, number];
  const x = scaleBand<string>().domain(airlines.map((d: RollupItem) => d[0])).range([0, width]).padding(0.1);
  const y = d3.scaleLinear().domain([0, d3.max(airlines, (d: RollupItem) => d[1]) as number]).nice().range([height, 0]);

    svg.selectAll("rect")
      .data(airlines as RollupItem[])
      .join("rect")
      .attr("x", (d: RollupItem) => x(d[0])!)
      .attr("y", (d: RollupItem) => y(d[1]))
      .attr("width", x.bandwidth())
      .attr("height", (d: RollupItem) => height - y(d[1]))
      .attr("fill", "#00ffff")
      .on("mouseover", (_event: MouseEvent, d: RollupItem) => console.log("Hover:", d));

    svg.selectAll(".x-axis").data([0]).join("g").attr("transform", `translate(0,${height})`).call(d3.axisBottom(x).tickSizeOuter(0));
    svg.selectAll(".y-axis").data([0]).join("g").call(d3.axisLeft(y));
  }, []);

  return <svg ref={ref} width={340} height={240}></svg>;
}