import Chart from "./Chart";

export default function Sidebar() {
  return (
    <div>
      <h2 className="text-xl font-semibold mb-2">Active Flights</h2>
      <Chart />
      <p className="mt-4 text-sm text-gray-400">
        Hover a bar to highlight flights by airline.
      </p>
    </div>
  );
}