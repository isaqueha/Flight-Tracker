import { Canvas } from "@react-three/fiber";
import { OrbitControls, Stars } from "@react-three/drei"
import Earth from "./Earth";

export default function Globe() {

  return (
    <Canvas camera={{ position: [0, 0, 3] }}>
      <ambientLight intensity={0.4} />
      <directionalLight position={[5, 3, 5]} intensity={1.2} />
      <Stars radius={100} depth={50} count={5000} factor={4} fade />

      <Earth />

      <OrbitControls enablePan={false} minDistance={1.5} maxDistance={6} />
    </Canvas>
  );
}