import * as d3 from "d3";
import { useEffect, useRef } from "react";

type FleetItem = { aircraft: string; count: number };

export default function AirlineFleetChart({ data }: { data: FleetItem[] }) {
  const ref = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    if (!data || data.length === 0) return;
    const svg = d3.select(ref.current);
    svg.selectAll("*").remove();

    const width = 260;
    const height = 160;
    svg.attr("viewBox", `0 0 ${width} ${height}`);

    type LocalScaleBand = ReturnType<typeof d3.scaleBand>;
    const x = d3
      .scaleBand()
      .domain(data.map((d: FleetItem) => d.aircraft))
      .range([30, width - 10])
      .padding(0.2) as unknown as LocalScaleBand & { domain: () => string[] };

    const y = d3
      .scaleLinear()
      .domain([0, d3.max(data, (d: FleetItem) => d.count) as number])
      .range([height - 30, 10]);

    svg
      .selectAll("rect")
      .data(data)
      .enter()
      .append("rect")
  .attr("x", (d: FleetItem) => x(d.aircraft) as number)
  .attr("y", (d: FleetItem) => y(d.count))
  .attr("width", x.bandwidth())
  .attr("height", (d: FleetItem) => height - 30 - y(d.count))
      .attr("fill", "#00ffff");

    svg
  .append("g")
  .attr("transform", `translate(0, ${height - 30})`)
  .call(d3.axisBottom(x as unknown as any));

    svg
      .append("g")
      .attr("transform", "translate(30,0)")
      .call(d3.axisLeft(y).ticks(4));
  }, [data]);

  return (
    // conditionally render if there is data
    data && data.length > 0 && (
    <div>
      <svg ref={ref} className="w-full h-40" /> 
      <p className="mt-2 text-sm text-gray-400">Fleet Composition</p>
    </div>
    )
  )
  ;
}
