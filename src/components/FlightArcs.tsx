import { useRef, useMemo, useState } from "react";
import { useFrame, type ThreeEvent } from "@react-three/fiber";
import * as THREE from "three";
import { Html } from "@react-three/drei";
import { latLonToVec3 } from "../helpers/geo";
import useFlightsData from "../hooks/useFlights";
import { useAppContext } from "../context/AppContext";

export default function FlightArcs() {
  const flights = useFlightsData();
  const groupRef = useRef();
  const [hoveredFlight, setHoveredFlight] = useState(null);
  const { setSelectedItem } = useAppContext();

  // --- Build each arc curve + geometry ---
  const arcs = useMemo(() => {
    return flights.map((f, i) => {
      const start = latLonToVec3(f.from.lat, f.from.lon, 1);
      const end = latLonToVec3(f.to.lat, f.to.lon, 1);

      const distance = start.angleTo(end);
      const altitude = 0.07 + distance * 0.25;
      const mid = new THREE.Vector3()
        .addVectors(start, end)
        .normalize()
        .multiplyScalar(1 + altitude);

      const curve = new THREE.QuadraticBezierCurve3(start, mid, end);
      const points = curve.getPoints(64);

      // TubeGeometry gives us a 3D cylinder line — great for pointer events
      const geometry = new THREE.TubeGeometry(curve, 64, 0.003, 8, false);

      const material = new THREE.ShaderMaterial({
        transparent: true,
        uniforms: {
          time: { value: 0 },
          color1: { value: new THREE.Color("#00ffff") },
          color2: { value: new THREE.Color("#ff00ff") },
        },
        vertexShader: `
          varying vec2 vUv;
          void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: `
          uniform float time;
          uniform vec3 color1;
          uniform vec3 color2;
          varying vec2 vUv;
          void main() {
            float fade = smoothstep(0.0, 0.9, fract(vUv.x + time));
            vec3 color = mix(color1, color2, vUv.x);
            gl_FragColor = vec4(color, fade * 0.8);
          }
        `,
      });

      const mesh = new THREE.Mesh(geometry, material);
      mesh.userData = { f, curve, id: i };
      mesh.frustumCulled = false;

      return mesh;
    });
  }, [flights]);

  // --- Animate trail & ✈ marker ---
  useFrame((state, delta) => {
    const t = (state.clock.elapsedTime * 0.05) % 1;

    groupRef.current?.children.forEach((mesh, i) => {
      const { curve } = mesh.userData;
      const progress = (t + i * 0.1) % 1;
      const pos = curve.getPoint(progress);
      const tangent = curve.getTangent(progress);

      // Update shader
      mesh.material.uniforms.time.value += delta * 0.4;

      // Move airplane icon if present
      const plane = mesh.children[0];
      if (plane) {
        plane.position.copy(pos);

        // Align the plane's Y axis to the curve tangent
        plane.quaternion.setFromUnitVectors(
          new THREE.Vector3(0, 1, 0),
          tangent.normalize()
        );

        // Rotate 90 degrees around Z so the emoji faces the direction of travel.
        // We multiply the quaternion so we preserve the tangent alignment and
        // then spin the mesh by +90deg (Math.PI/2). If the emoji faces the
        // wrong way, flip the sign here.
        const zQuat = new THREE.Quaternion();
        zQuat.setFromAxisAngle(new THREE.Vector3(0, 0, 1), Math.PI / 2);
        plane.quaternion.multiply(zQuat);
      }
    });
  });

  return (
    <group ref={groupRef}>
      {arcs.map((mesh, i) => {
        const flight = mesh.userData.f;
        const midPoint = mesh.userData.curve.getPoint(0.5);

        return (
          <primitive
            key={i}
            object={mesh}
            onPointerOver={(e: ThreeEvent<PointerEvent>) => {
              e.stopPropagation();
              setHoveredFlight(flight);
              mesh.material.uniforms.color1.value.set("#ffffff");
              document.body.style.cursor = "pointer";
            }}
            onPointerOut={(e: ThreeEvent<PointerEvent>) => {
              e.stopPropagation();
              setHoveredFlight(null);
              mesh.material.uniforms.color1.value.set("#00ffff");
              document.body.style.cursor = "auto";
            }}
            onClick={() => setSelectedItem({ type: "flight", data: flight })}
          >
            {/* ✈ emoji following tip */}
            <Html
              position={mesh.userData.curve.getPoint(0)}
              as="div"
              transform
              occlude
              distanceFactor={1}
            >
              <div className="text-2xl select-none">✈</div>
            </Html>

            {/* Tooltip only when hovered */}
            {hoveredFlight === flight && (
              <Html position={midPoint} scale={0.33}>
                <div className="bg-black/70 text-white text-xs px-2 py-1 rounded-md shadow border border-white/20">
                  ✈ {flight.airline}<br />
                  {flight.from.code} → {flight.to.code}
                </div>
              </Html>
            )}
          </primitive>
        );
      })}
    </group>
  );
}
