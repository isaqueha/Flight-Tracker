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
      airports.map((a) => ({
        ...a,
        position: latLonToVec3(a.lat, a.lon, 1.001), // slightly above surface
      })),
    [airports]
  );

  // Slight pulsing animation for hovered/selected markers
  useEffect(() => {
    let raf;
    const start = performance.now();
    const animate = (t) => {
      const elapsed = (t - start) / 1000;
      if (groupRef.current) {
        groupRef.current.children.forEach((child) => {
          const meta = child.userData;
          if (!meta) return;
          const isHover = hovered && meta.icao === hovered.icao;
          const isSelected = selectedIcao && meta.icao === selectedIcao;
          const baseScale = meta.baseScale ?? 1;
          const pulse = 1 + (isHover ? 0.25 * Math.sin(elapsed * 6) : 0.0);
          child.scale.setScalar(baseScale * (isSelected ? 1.6 : pulse));
        });
      }
      raf = requestAnimationFrame(animate);
    };
    raf = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf);
  }, [hovered, selectedIcao]);

  return (
    <group ref={groupRef}>
      {airportNodes.map((a) => {
        const color = selectedIcao === a.icao ? 0xffd166 : 0x4ee1ff;
        return (
          <mesh
            key={a.icao + a.lat + a.lon}
            position={[a.position.x, a.position.y, a.position.z]}
            userData={{ icao: a.icao }}
            onPointerOver={(e) => {
              e.stopPropagation();
              setHovered(a);
              document.body.style.cursor = "pointer";
            }}
            onPointerOut={(e) => {
              e.stopPropagation();
              setHovered((cur) => (cur && cur.icao === a.icao ? null : cur));
              document.body.style.cursor = "auto";
            }}
            onClick={(e) => {
              e.stopPropagation();
              setSelectedIcao(a.icao);
              setSelectedItem({ type: "airport", data: a });
              console.log("Selected airport:", a, airportStats[a.icao?.toUpperCase()]);
            }}
          >
            <sphereGeometry args={[markerRadius, 12, 12]} />
            <meshStandardMaterial
              emissive={new THREE.Color(color)}
              emissiveIntensity={0.6}
              metalness={0.1}
              roughness={0.4}
            />
            {/* Tooltip via Html from drei. Only render when hovered */}
            {hovered && hovered.icao === a.icao && (
              <Html
                center
                position={[0, markerRadius * 1.6, 0]}
                // transform
                scale={0.5}
                distanceFactor={2}
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
                    borderRadius: 6,
                    fontSize: 12,
                    border: "1px solid rgba(255,255,255,0.06)",
                    boxShadow: "0 6px 18px rgba(2,6,23,0.6)",
                  }}
                >
                  <div style={{ fontWeight: 700 }}>{a.name}</div>
                  <div style={{ opacity: 0.85, fontSize: 11 }}>
                    {a.city} — {a.country}
                  </div>
                  <div style={{ marginTop: 6, fontSize: 11, opacity: 0.8 }}>
                    {a.icao ? `ICAO: ${a.icao}` : a.iata ? `IATA: ${a.iata}` : ""}
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
