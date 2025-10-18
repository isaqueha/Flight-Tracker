import { useMemo } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import useFlightsData from "../hooks/useFlights";

const EARTH_RADIUS = 1;

export default function FlightsLayer() {
  const flights = useFlightsData();

  const lines = useMemo(() => {
    const group = new THREE.Group();
    flights.forEach((f) => {
      const { from, to } = f;
      const start = latLonToVec3(from.lat, from.lon, EARTH_RADIUS);
      const end = latLonToVec3(to.lat, to.lon, EARTH_RADIUS);

      const distance = start.angleTo(end); // radians between points on sphere
      const altitude = 0.05 + distance * 0.25; // higher curve for distant flights
      const mid = new THREE.Vector3()
        .addVectors(start, end)
        .normalize()
        .multiplyScalar(EARTH_RADIUS * (1 + altitude));

      // Create smooth curve
      const curve = new THREE.QuadraticBezierCurve3(start, mid, end);
      const points = curve.getPoints(64);

      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      const material = new THREE.LineBasicMaterial({
        color: 0x00ffff,
        transparent: true,
        opacity: 0.7,
        linewidth: 2,
      });

      const line = new THREE.Line(geometry, material);
      group.add(line);
    });

    return group;
  }, [flights]);

  useFrame(() => {
    // lines.rotation.y += 0.0005;
  });

  return <primitive object={lines} />;
}

function latLonToVec3(lat, lon, radius = 1) {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);
  return new THREE.Vector3(
    -radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta)
  );
}