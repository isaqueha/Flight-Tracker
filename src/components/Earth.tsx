import { useRef } from "react";
import { useFrame, useLoader } from "@react-three/fiber";
import * as THREE from "three";
import AirportPoints from "./AirportPoints";
import FlightsLayer from "./FlightArcs";

export default function Earth() {
  const mesh = useRef<THREE.Mesh>(null!);

  // Load maps: color, normal, specular, clouds
  const [colorMap, normalMap, specMap, cloudsMap] = useLoader(THREE.TextureLoader, [
    "/textures/8k_earth_daymap.jpg",
    "/textures/8k_earth_normal_map.jpg",
    "/textures/8k_earth_specular_map.png",
    "/textures/8k_earth_clouds.jpg",
  ]);

  const earthRef = useRef<THREE.Mesh>(null!);
  const cloudsRef = useRef<THREE.Mesh>(null!);

  useFrame(() => {
    // slow rotation for the earth
    // if (mesh.current) mesh.current.rotation.y += 0.0005;
    // slightly faster rotation for clouds for a parallax effect
    if (cloudsRef.current) cloudsRef.current.rotation.y += 0.0004;
  });

  return (
    <group ref={mesh}>
      {/* Earth mesh */}
      <mesh ref={earthRef}>
        <sphereGeometry args={[1, 64, 64]} />
        <meshPhongMaterial
          map={colorMap}
          normalMap={normalMap}
          normalScale={new THREE.Vector2(1, 1)}
          specularMap={specMap}
          specular={new THREE.Color(0x222222)}
          shininess={20}
        />
      </mesh>

      {/* Clouds layer slightly above the surface */}
      <mesh ref={cloudsRef}>
        <sphereGeometry args={[1.01, 64, 64]} />
        <meshPhongMaterial
          map={cloudsMap}
          transparent={true}
          opacity={0.2}
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Layers */}
      <AirportPoints />
      <FlightsLayer earthRef={earthRef} />
    </group>
  );
}