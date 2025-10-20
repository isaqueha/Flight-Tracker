// src/components/AirportPoints.jsx
import React, { useEffect, useState, useRef, useMemo } from "react";
import * as THREE from "three";
import { Html } from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import { latLonToVec3 } from "../helpers/geo";
import { useAppContext } from "../context/AppContext";
import airportStats from "../../public/data/airportStats.json";


/**
 * AirportPoints
 * Renders airport markers from public/data/airports.json
 *
 * Props:
 *  - src (string): path to airports json (defaults to '/data/airports.json')
 *  - markerRadius (number): sphere radius in world units (default 0.008)
 */
export default function AirportPoints({
  src = "/data/airports.json",
  markerRadius = 0.008,
}) {
  const [airports, setAirports] = useState([]);
  const [hovered, setHovered] = useState(null);
  const [selectedIcao, setSelectedIcao] = useState(null);
  const groupRef = useRef();
  const { setSelectedItem } = useAppContext();

  useEffect(() => {
    let mounted = true;
    fetch(src)
      .then((r) => r.json())
      .then((data) => {
        if (!mounted) return;
        // keep only necessary fields and ensure numbers
        const cleaned = data.map((a) => ({
          icao: a.icao ?? a.iata ?? a.code ?? "",
          iata: a.iata ?? "",
          name: a.name ?? "",
          city: a.city ?? "",
          country: a.country ?? "",
          lat: Number(a.lat),
          lon: Number(a.lon),
        }));
        setAirports(cleaned);
      })
      .catch((err) => {
        console.error("Failed to load airports.json:", err);
      });
    return () => (mounted = false);
  }, [src]);

  // Precompute positions (Vector3) for each airport
  const airportNodes = useMemo(
    () =>
      airports.map((airport) => ({
        ...airport,
        position: latLonToVec3(airport.lat, airport.lon, 1.001), // slightly above surface
      })),
    [airports]
  );

  return (
    <group ref={groupRef}>
      {airportNodes.map((airport) => {
        const color = selectedIcao === airport.icao ? 0xff9966 : 0x4ee1ff;
        return (
          <mesh
            key={airport.icao + airport.lat + airport.lon}
            position={[airport.position.x, airport.position.y, airport.position.z]}
            userData={{ icao: airport.icao }}
            onPointerOver={(e) => {
              e.stopPropagation();
              setHovered(airport);
              console.log("hover", airport.icao);
              document.body.style.cursor = "pointer";
            }}
            onPointerOut={(e) => {
              e.stopPropagation();
              setHovered(null);
              document.body.style.cursor = "auto";
            }}
            onClick={(e) => {
              e.stopPropagation();
              setSelectedIcao(airport.icao);
              setSelectedItem({ type: "airport", data: airport });
            }}
          >
            <sphereGeometry args={[markerRadius, 12, 12]} />
            <meshStandardMaterial
              emissive={new THREE.Color(color)}
              emissiveIntensity={0.3}
              metalness={0.9}
              roughness={0.4}
            />
            {/* Tooltip via Html from drei. Only render when hovered */}
            {hovered && hovered.icao === airport.icao && (
              <Html
                center
                position={[0, markerRadius * 1.6, 0]}
                // transform
                scale={0.5}
                // distanceFactor={2}
                occlude={true}
                style={{
                  pointerEvents: "none",
                  whiteSpace: "nowrap",
                }}
              >
                <div
                  style={{
                    padding: "6px 10px",
                    background: "rgba(10,10,12,0.85)",
                    color: "white",
                    display: "flex",
                    borderRadius: 6,
                    fontSize: 16,
                    border: "1px solid rgba(255,255,255,0.06)",
                    boxShadow: "0 6px 18px rgba(2,6,23,0.6)",
                  }}
                >
                  <div style={{ fontWeight: 700 }}>{airport.name}</div>
                  <div style={{ marginLeft: 6, fontSize: 12, opacity: 0.8 }}>
                    ({`${airport.icao}`})
                  </div>
                </div>
              </Html>
            )}
          </mesh>
        );
      })}
    </group>
  );
}
