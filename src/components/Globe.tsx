// import FlightsLayer from "./FlightsLayer";
// import AirportPoints from "./AirportPoints";
import * as THREE from "three";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Stars } from "@react-three/drei"
import { useRef } from "react";

export default function Globe() {
  const earthMesh = useRef<THREE.Mesh>(null!);
  
  // useFrame(() => {
  //   earthMesh.current.rotation.y += 0.0005;
  // });

  return (
    <Canvas camera={{ position: [0, 0, 3] }}>
      <ambientLight intensity={0.4} />
      <directionalLight position={[5, 3, 5]} intensity={1.2} />
      <Stars radius={100} depth={50} count={5000} factor={4} fade />

      {/* Earth sphere */}
      <mesh ref={earthMesh}>
        <sphereGeometry args={[1, 512, 512]} />
        <meshPhongMaterial
          map={new THREE.TextureLoader().load("/textures/8k_earth_daymap.jpg")}
          bumpMap={new THREE.TextureLoader().load("/textures/8k_earth_normal_map.jpg")}
          bumpScale={0.01}
        />
      </mesh>

      {/* Layers */}
      {/* <AirportPoints />
      <FlightsLayer /> */}

      <OrbitControls enablePan={false} minDistance={1.5} maxDistance={6} />
    </Canvas>
  );
}