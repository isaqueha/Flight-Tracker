import AirlineFleetChart from "./charts/AirlineFleetChart";
import PassengerVolumeChart from "./charts/PassengerVolumeChart";
import airlines from "../../public/data/airlines.json";
import airportStats from "../../public/data/airportStats.json";

type AirportStatsMap = Record<string, { passengers: number[]; popularDestinations: string[] }>;
import { useAppContext } from "../context/AppContext";
import DestinationDonutChart from "./charts/DestinationDonutChart";
import TripLengthChart from "./charts/TripLengthChart";

export default function SidePanel() {
  const { selectedItem } = useAppContext();

  if (!selectedItem) return (
    <div className="p-4 text-gray-400 text-2xl font-bold underline">Select a flight or airport to see details.</div>
  );

  const { type, data } = selectedItem;

  return (
    <div className="p-4 bg-gray-900 text-white h-auto overflow-auto">
      <h2 className="text-lg font-semibold mb-3 capitalize">{type} details</h2>

      {type === "airport" && (
        <>
          <p><strong>{data.name}</strong> ({data.icao})</p>
          <p>{data.city}, {data.country}</p>
          {((airportStats as unknown) as AirportStatsMap)[(data.icao as string)?.toUpperCase()] ? (
            <>
              <p className="mt-2 text-sm text-gray-400">Monthly passenger volume</p>
              <PassengerVolumeChart passengers={((airportStats as unknown) as AirportStatsMap)[(data.icao as string).toUpperCase()].passengers} />

              <DestinationDonutChart destinations={((airportStats as unknown) as AirportStatsMap)[(data.icao as string).toUpperCase()].popularDestinations} />
            </>
          ) : (
            <p className="text-gray-500 text-sm mt-2">No data available for this airport.</p>
          )}
        </>
      )}

      {type === "flight" && (
        <>
          <p><strong>{data.id} - {data.airline}</strong></p>
          <p>{data.from.code} → {data.to.code}</p>
          <AirlineFleetChart data={airlines.filter((a) => a.airline === data.airline)} />
          <TripLengthChart flight={data} />
        </>
      )}
    </div>
  );
}
