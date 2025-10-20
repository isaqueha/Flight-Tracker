import { useRef, useMemo, useState } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { Html } from "@react-three/drei";
import { latLonToVec3 } from "../helpers/geo";
import useFlightsData from "../hooks/useFlights";
import { useAppContext } from "../context/AppContext";

export default function FlightArcs({ }) {
  const flights = useFlightsData();
  const groupRef = useRef();
  const [hoveredFlight, setHoveredFlight] = useState(null); // 👈 track hovered flight
  const { setSelectedItem } = useAppContext();

  // Precompute curve geometries + materials
  const arcs = useMemo(() => {
    return flights.map((f) => {
      const start = latLonToVec3(f.from.lat, f.from.lon, 1);
      const end = latLonToVec3(f.to.lat, f.to.lon, 1);

      // curved midpoint (raised)
      const distance = start.angleTo(end);
      const altitude = 0.07 + distance * 0.25;
      const mid = new THREE.Vector3()
        .addVectors(start, end)
        .normalize()
        .multiplyScalar(1 + altitude);

      const curve = new THREE.QuadraticBezierCurve3(start, mid, end);
      const points = curve.getPoints(128);
      const geometry = new THREE.BufferGeometry().setFromPoints(points);

      // Gradient line material using shader
      const material = new THREE.ShaderMaterial({
        transparent: true,
        uniforms: {
          time: { value: 0 },
          color1: { value: new THREE.Color("#00ffff") },
          color2: { value: new THREE.Color("#ff00ff") },
        },
        vertexShader: `
          varying float vProgress;
          void main() {
            vProgress = position.y;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: `
          uniform float time;
          uniform vec3 color1;
          uniform vec3 color2;
          varying float vProgress;

          void main() {
            float trail = smoothstep(0.0, 0.8, fract(vProgress + time));
            vec3 color = mix(color1, color2, vProgress);
            gl_FragColor = vec4(color, trail * 0.9);
          }
        `,
      });

      const line = new THREE.Line(geometry, material);
      line.userData = { f, curve };

      return line;
    });
  }, [flights]);

   // ✅ Animate flight progress + plane movement
  useFrame((state, delta) => {
    const t = (state.clock.elapsedTime * 0.05) % 1;
    groupRef.current.children.forEach((line, i) => {
      const { curve } = line.userData;
      const progress = (t + i * 0.1) % 1;
      const pos = curve.getPoint(progress);
      const tangent = curve.getTangent(progress);

      const plane = line.children[0];
      if (plane) {
        plane.position.copy(pos);
        plane.quaternion.setFromUnitVectors(
          new THREE.Vector3(0, 1, 0),
          tangent.normalize()
        );
      }

      // Move gradient animation
      line.material.uniforms.time.value += delta * 0.5;
    });
  });

  return (
    <group ref={groupRef}>
      {arcs.map((line, i) => {
        const flight = line.userData.f;
        const midPoint = line.userData.curve.getPoint(0.5);

        return (
        <primitive
          key={i}
          object={line}
           onPointerOver={(e) => {
            e.stopPropagation();
            setHoveredFlight(flight); // 👈 set current hovered flight
            line.material.uniforms.color1.value.set("#ffffff");
            document.body.style.cursor = "pointer";
          }}
          onPointerOut={(e) => {
            e.stopPropagation();
            setHoveredFlight(null); // 👈 clear hover
            line.material.uniforms.color1.value.set("#00ffff");
            document.body.style.cursor = "auto";
          }}
          // onClick={() => setSelectedItem({ type: "flight", data: flight })}
        >
           {/* Render tooltip only if this is the hovered flight */}
            {hoveredFlight === flight && (
              <Html
                // transform
                scale={0.33}
                // distanceFactor={2.0}
                position={midPoint}
              >
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