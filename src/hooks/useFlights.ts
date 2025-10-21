import { useState, useEffect } from "react";
import type { Flight } from "../types/models";

export default function useFlightsData() {
  const [flights, setFlights] = useState<Flight[]>([]);

  useEffect(() => {
    fetch("/data/sample_flights.json")
      .then((r) => r.json())
      .then((data: Flight[]) => setFlights(data))
      .catch(() => setFlights([]));
  }, []);

  return flights;
}