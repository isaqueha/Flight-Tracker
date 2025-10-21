export type Flight = {
  id: string;
  airline: string;
  from: { code: string; lat: number; lon: number };
  to: { code: string; lat: number; lon: number };
  currentPosition?: { lat: number; lon: number };
};

export type Airport = {
  icao: string;
  iata?: string;
  name?: string;
  city?: string;
  country?: string;
  lat: number;
  lon: number;
};

export type SelectedItem =
  | { type: "flight"; data: Flight }
  | { type: "airport"; data: Airport }
  | null;
