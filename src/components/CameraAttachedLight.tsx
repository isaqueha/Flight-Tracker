// src/components/Globe.jsx
import { useFrame, useThree } from "@react-three/fiber";
import { useRef } from "react";

export default function CameraAttachedLight({ intensity = 1.2, offset = [0, 0, 0.1] }) {
  const lightRef = useRef();
  const { camera } = useThree();

  useFrame(() => {
    if (!lightRef.current) return;
    // copy camera world position into light (plus optional offset)
    lightRef.current.position.set(
      camera.position.x + offset[0],
      camera.position.y + offset[1],
      camera.position.z + offset[2]
    );
    // always point to the world origin (Earth)
    lightRef.current.lookAt(0, 0, 0);
  });

  return (
    <directionalLight
      ref={lightRef}
      position={[0, 0, 0]} // will be overwritten in useFrame
      intensity={intensity}
      castShadow
    />
  );
}