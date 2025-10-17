import { useMemo } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import useFlightsData from "../hooks/useFlightsData";

export default function FlightsLayer() {
  const flights = useFlightsData();

  const lines = useMemo(() => {
    const group = new THREE.Group();
    flights.forEach((f) => {
      const { from, to } = f;
      const start = latLonToVec3(from.lat, from.lon);
      const end = latLonToVec3(to.lat, to.lon);
      const curve = new THREE.QuadraticBezierCurve3(
        start,
        start.clone().add(end).multiplyScalar(0.5).setLength(1.05),
        end
      );
      const points = curve.getPoints(50);
      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      const material = new THREE.LineBasicMaterial({ color: 0x00ffff, transparent: true, opacity: 0.6 });
      const line = new THREE.Line(geometry, material);
      group.add(line);
    });
    return group;
  }, [flights]);

  useFrame(() => {
    lines.rotation.y += 0.0005;
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