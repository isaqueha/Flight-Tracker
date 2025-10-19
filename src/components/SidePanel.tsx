import AirlineFleetChart from "./charts/AirlineFleetChart";
import PassengerVolumeChart from "./charts/PassengerVolumeChart";
import airlines from "../../public/data/airlines.json";
import airportStats from "../../public/data/airportStats.json";
import { useAppContext } from "../context/AppContext";
import DestinationDonutChart from "./charts/DestinationDonutChart";

export default function SidePanel() {
  const { selectedItem } = useAppContext();

  if (!selectedItem) return (
    <div className="p-4 text-gray-400 italic">Select a flight or airport to see details.</div>
  );

  const { type, data } = selectedItem;

  return (
    <div className="p-4 bg-gray-900 text-white h-full overflow-auto">
      <h2 className="text-lg font-semibold mb-3 capitalize">{type} details</h2>

      {type === "airport" && (
        <>
          <p><strong>{data.name}</strong> ({data.icao})</p>
          <p>{data.city}, {data.country}</p>
          {airportStats[data.icao?.toUpperCase()] ? (
            <>
              <p className="mt-2 text-sm text-gray-400">Monthly passenger volume</p>
              <PassengerVolumeChart passengers={airportStats[data.icao.toUpperCase()].passengers} />

              <DestinationDonutChart destinations={airportStats[data.icao.toUpperCase()].popularDestinations} />
            </>
          ) : (
            <p className="text-gray-500 text-sm mt-2">No data available for this airport.</p>
          )}
        </>
      )}

      {type === "flight" && (
        <>
          <p><strong>{data.airline}</strong></p>
          <p>{data.from.code} → {data.to.code}</p>
          <p>Altitude: {data.altitude || "unknown"}</p>
          <p>Speed: {data.speed || "unknown"} km/h</p>
          <p className="mt-2 text-sm text-gray-400">Fleet Composition</p>
          <AirlineFleetChart data={airlines.filter((a) => a.airline === data.airline)} />
        </>
      )}
    </div>
  );
}
