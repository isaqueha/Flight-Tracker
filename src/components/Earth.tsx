import { useRef } from "react";
import { useFrame, useLoader } from "@react-three/fiber";
import * as THREE from "three";
import AirportPoints from "./AirportPoints";
import FlightsLayer from "./FlightArcs";

export default function Earth() {
  const mesh = useRef<THREE.Mesh>(null!);

  const [colorMap, bumpMap] = useLoader(THREE.TextureLoader, [
    "/textures/8k_earth_daymap.jpg",
    "/textures/8k_earth_normal_map.jpg",
  ]);

  useFrame(() => {
    // mesh.current.rotation.y += 0.0005;
  });

  const earthRef = useRef<THREE.Mesh>(null!);

  return (
    <group ref={mesh}>
      {/* Earth mesh */}
      <mesh ref={earthRef}>
        <sphereGeometry args={[1, 64, 64]} />
        <meshPhongMaterial map={colorMap} bumpMap={bumpMap} bumpScale={0.05} />
      </mesh>

      {/* Layers */}
      <AirportPoints />
      <FlightsLayer earthRef={earthRef} />
    </group>
  );
}