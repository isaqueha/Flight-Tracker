import { useRef, useMemo, useState } from "react";
import { useFrame, type ThreeEvent, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { Html } from "@react-three/drei";
import { latLonToVec3 } from "../helpers/geo";
import useFlightsData from "../hooks/useFlights";
import { useAppContext } from "../context/AppContext";

type FlightData = {
  from: { lat: number; lon: number; code: string };
  to: { lat: number; lon: number; code: string };
  airline: string;
};

type FlightMesh = THREE.Object3D & { material?: ShaderMaterialWithUniforms; userData?: { f?: FlightData; curve?: THREE.Curve<THREE.Vector3>; id?: number }; children?: THREE.Object3D[] };
type ShaderMaterialWithUniforms = THREE.ShaderMaterial & {
  uniforms: {
    time: { value: number };
    color1: { value: THREE.Color };
    color2: { value: THREE.Color };
    opacityMin: { value: number };
    opacityMax: { value: number };
    headSigma: { value: number };
    headBoost: { value: number };
  };
};

export default function FlightArcs({ earthRef }: { earthRef?: React.RefObject<THREE.Mesh> }) {
  const flights = useFlightsData();
  const groupRef = useRef<THREE.Group>(null!);
  const [hoveredFlight, setHoveredFlight] = useState<FlightData | null>(null);
  const [hoverPos, setHoverPos] = useState<THREE.Vector3 | null>(null);
  const { setSelectedItem } = useAppContext();
  const TOOLTIP_OFFSET = 0.03; // world units to push tooltip slightly above the arc when following cursor
  const { camera, gl } = useThree();
  const raycasterRef = useRef(new THREE.Raycaster());
  const planeRefs = useRef<Map<number, THREE.Object3D>>(new Map());
  

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

      // TubeGeometry gives us a 3D cylinder line — great for pointer events
      const geometry = new THREE.TubeGeometry(curve, 64, 0.003, 8, false);

      const material = new THREE.ShaderMaterial({
        transparent: true,
        uniforms: {
          time: { value: 0 },
          color1: { value: new THREE.Color("#00ffff") },
          color2: { value: new THREE.Color("#ff00ff") },
          opacityMin: { value: 0.45 },
          opacityMax: { value: 1.0 },
          headSigma: { value: 0.02 },
          headBoost: { value: 0.6 },
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
          uniform float opacityMin;
          uniform float opacityMax;
          uniform float headSigma;
          uniform float headBoost;
          varying vec2 vUv;
          void main() {
            // reverse the animation so a positive progress moves from start->end
            float phase = fract(vUv.x - time);

            // fade acts as the running tail alpha (0..1)
            float fade = smoothstep(0.0, 0.9, phase);

            // create a small circular/gaussian head centered at phase==0
            float dist = min(phase, 1.0 - phase);
            // gaussian-like peak (sigma controls width)
            float head = exp(- (dist * dist) / (headSigma * headSigma));

            // base color along the tube
            vec3 base = mix(color1, color2, vUv.x);

            // add head brightness (adds white-ish highlight)
            vec3 color = base + head * vec3(1.0);

            // alpha mixes tail opacity then adds head boost (clamped)
            float alpha = mix(opacityMin, opacityMax, fade) + head * headBoost;
            alpha = clamp(alpha, 0.0, 1.0);

            gl_FragColor = vec4(color, alpha);
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
    const base = (state.clock.elapsedTime * 0.08) % 1;

    groupRef.current?.children.forEach((m, i) => {
      const mesh = m as FlightMesh;
      const { curve } = mesh.userData;
      if (!curve) return;

      // Progress is the single source of truth for both shader animation and plane placement
      const progress = (base + i * 0.06) % 1;
      const pos = curve.getPoint(progress);
      const tangent = curve.getTangent(progress).clone();

      // Update shader time to match the progress so the visual head is in sync
      (mesh.material as ShaderMaterialWithUniforms).uniforms.time.value = progress;

      // Move airplane icon group if present (we attach a group ref per arc)
      const planeObj = planeRefs.current.get(mesh.userData.id as number);
      if (planeObj) {
        planeObj.position.copy(pos);
        planeObj.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), tangent.normalize());
        const zQuat = new THREE.Quaternion();
        zQuat.setFromAxisAngle(new THREE.Vector3(0, 0, 1), Math.PI / 2);
        planeObj.quaternion.multiply(zQuat);
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
              setHoverPos(e.point.clone());
              (mesh.material as ShaderMaterialWithUniforms).uniforms.color1.value.set("#ffffff");
              document.body.style.cursor = "pointer";
            }}
            onPointerMove={(e: ThreeEvent<PointerEvent>) => {
              e.stopPropagation();
              // update tooltip position while moving over the arc
              if (hoveredFlight === flight) setHoverPos(e.point.clone());
            }}
            onPointerOut={(e: ThreeEvent<PointerEvent>) => {
              e.stopPropagation();
              setHoveredFlight(null);
              setHoverPos(null);
              (mesh.material as ShaderMaterialWithUniforms).uniforms.color1.value.set("#00ffff");
              document.body.style.cursor = "auto";
            }}
            onClick={() => setSelectedItem({ type: "flight", data: flight })}
          >
            {/* ✈ emoji following tip: render inside a group so we can control transform from useFrame */}
            <group
              ref={(g) => {
                if (!g) return;
                planeRefs.current.set(mesh.userData.id as number, g);
              }}
            >
              <Html
                position={[0, 0, 0]}
                as="div"
                transform
                occlude={earthRef ? [earthRef] : undefined}
                distanceFactor={1}
              >
                <div
                  className="text-2xl select-none"
                  onPointerOver={(e) => {
                    e.stopPropagation();
                    setHoveredFlight(flight);
                    // compute intersection point from DOM event to position tooltip
                    const rect = (gl.domElement as HTMLCanvasElement).getBoundingClientRect();
                    const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
                    const y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
                    const ray = raycasterRef.current;
                    ray.setFromCamera(new THREE.Vector2(x, y), camera);
                    const intersects = ray.intersectObject(mesh, true);
                    if (intersects.length) setHoverPos(intersects[0].point.clone());
                    (mesh.material as ShaderMaterialWithUniforms).uniforms.color1.value.set("#ffffff");
                    document.body.style.cursor = "pointer";
                  }}
                  onPointerOut={(e) => {
                    e.stopPropagation();
                    setHoveredFlight(null);
                    setHoverPos(null);
                    (mesh.material as ShaderMaterialWithUniforms).uniforms.color1.value.set("#00ffff");
                    document.body.style.cursor = "auto";
                  }}
                  onPointerMove={(e) => {
                    e.stopPropagation();
                    const rect = (gl.domElement as HTMLCanvasElement).getBoundingClientRect();
                    const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
                    const y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
                    const ray = raycasterRef.current;
                    ray.setFromCamera(new THREE.Vector2(x, y), camera);
                    const intersects = ray.intersectObject(mesh, true);
                    if (intersects.length) setHoverPos(intersects[0].point.clone());
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedItem({ type: "flight", data: flight });
                  }}
                >
                  ✈
                </div>
              </Html>
            </group>

            {/* Tooltip only when hovered; position follows the mouse (hoverPos) */}
            {/* Tooltip only when hovered */}
            {hoveredFlight === flight && (
              (() => {
                const base = (hoverPos ?? midPoint).clone();
                const tooltipPos = base.add(base.clone().normalize().multiplyScalar(TOOLTIP_OFFSET));
                return (
                  <Html position={tooltipPos} scale={0.33} occlude={false}>
                    <div className="bg-black/70 text-white text-xs px-2 py-1 rounded-md shadow border border-white/20">
                      {flight.id} — {flight.airline}
                    </div>
                  </Html>
                );
              })()
            )}
          </primitive>
        );
      })}
    </group>
  );
}
