import * as d3 from "d3";
import { useEffect, useRef } from "react";
import flights from "../../../public/data/sample_flights.json";
import type { Flight } from "../../types/models";

function haversineDistance(a: { lat: number; lon: number }, b: { lat: number; lon: number }) {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const R = 6371; // km
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lon - a.lon);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);

  const sinDLat = Math.sin(dLat / 2);
  const sinDLon = Math.sin(dLon / 2);
  const aa = sinDLat * sinDLat + Math.cos(lat1) * Math.cos(lat2) * sinDLon * sinDLon;
  const c = 2 * Math.atan2(Math.sqrt(aa), Math.sqrt(1 - aa));
  return R * c;
}

export default function TripLengthChart({ flight }: { flight?: Flight | null }) {
  const ref = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    const svg = d3.select(ref.current as unknown as SVGSVGElement);
    svg.selectAll("*").remove();

    const allFlights = (flights as unknown) as Flight[];
    const distances: number[] = allFlights.map((f) =>
      haversineDistance({ lat: f.from.lat, lon: f.from.lon }, { lat: f.to.lat, lon: f.to.lon })
    );

    const selectedDistance: number | null = flight
      ? haversineDistance({ lat: flight.from.lat, lon: flight.from.lon }, { lat: flight.to.lat, lon: flight.to.lon })
      : null;

    const width = 260;
    const height = 90;
    const margin = { top: 6, right: 10, bottom: 18, left: 30 };
    svg.attr("viewBox", `0 0 ${width} ${height}`);

    const x = d3
      .scaleLinear()
      .domain([0, (d3.max(distances) as number) || 0])
      .range([margin.left, width - margin.right]);

    // histogram bins
    type NumberBin = number[] & { x0?: number; x1?: number };
    const bins = d3.bin().thresholds(18)(distances) as NumberBin[];

    const y = d3
      .scaleLinear()
      .domain([0, d3.max(bins, (b: NumberBin) => b.length) as number])
      .range([height - margin.bottom, margin.top]);

    // bars
    svg
      .append("g")
  .selectAll("rect")
  .data(bins)
  .enter()
  .append("rect")
  .attr("x", (d: NumberBin) => x(d.x0! as number) + 1)
  .attr("y", (d: NumberBin) => y(d.length))
  .attr("width", (d: NumberBin) => Math.max(1, x(d.x1! as number) - x(d.x0! as number) - 2))
  .attr("height", (d: NumberBin) => y(0) - y(d.length))
  .attr("fill", "#1fb6ff")
  .attr("opacity", 0.8);

    // x axis
    svg
      .append("g")
      .attr("transform", `translate(0,${height - margin.bottom})`)
      .call(
        d3
          .axisBottom(x)
          .ticks(4)
          .tickFormat((d: number | Date) => `${Math.round(Number(d))} km`)
      )
      .selectAll("text")
      .attr("font-size", "9px")
      .attr("fill", "#ccc");

    // marker for selected flight
    if (selectedDistance !== null) {
      svg
        .append("line")
        .attr("x1", x(selectedDistance))
        .attr("x2", x(selectedDistance))
        .attr("y1", margin.top)
        .attr("y2", height - margin.bottom)
        .attr("stroke", "#ffdd57")
        .attr("stroke-width", 2)
        .attr("stroke-dasharray", "4 3");

      svg
        .append("text")
        .attr("x", x(selectedDistance))
        .attr("y", margin.top + 10)
        .attr("text-anchor", "middle")
        .attr("fill", "#ffdd57")
        .attr("font-size", "10px")
        .text(`${Math.round(selectedDistance)} km`);
    }
  }, [flight]);

  return (
    <div className="w-full flex flex-col items-start mt-3">
      <svg ref={ref} className="w-full h-24" />
      <p className="mt-2 text-sm text-gray-400">Trip length vs other trips</p>
    </div>
  );
}
