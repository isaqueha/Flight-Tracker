import { useState, useEffect } from "react";

export default function useFlightsData() {
  const [flights, setFlights] = useState([]);

  useEffect(() => {
    fetch("../data/sample_flights.json")
      .then((r) => r.json())
      .then(setFlights);
  }, []);

  return flights;
}