"use client"

import { useRef, useMemo, useState } from "react"
import { useFrame } from "@react-three/fiber"
import * as THREE from "three"
import { MeshGradient, DotOrbit } from "@paper-design/shaders-react"
import s from "./ShaderDemo.module.css"

// Custom shader material for advanced effects
const vertexShader = `
  uniform float time;
  uniform float intensity;
  varying vec2 vUv;
  varying vec3 vPosition;

  void main() {
    vUv = uv;
    vPosition = position;

    vec3 pos = position;
    pos.y += sin(pos.x * 10.0 + time) * 0.1 * intensity;
    pos.x += cos(pos.y * 8.0 + time * 1.5) * 0.05 * intensity;

    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`

const fragmentShader = `
  uniform float time;
  uniform float intensity;
  uniform vec3 color1;
  uniform vec3 color2;
  varying vec2 vUv;
  varying vec3 vPosition;

  void main() {
    vec2 uv = vUv;

    // Create animated noise pattern
    float noise = sin(uv.x * 20.0 + time) * cos(uv.y * 15.0 + time * 0.8);
    noise += sin(uv.x * 35.0 - time * 2.0) * cos(uv.y * 25.0 + time * 1.2) * 0.5;

    // Mix colors based on noise and position
    vec3 color = mix(color1, color2, noise * 0.5 + 0.5);
    color = mix(color, vec3(1.0), pow(abs(noise), 2.0) * intensity);

    // Add glow effect
    float glow = 1.0 - length(uv - 0.5) * 2.0;
    glow = pow(glow, 2.0);

    gl_FragColor = vec4(color * glow, glow * 0.8);
  }
`

export function ShaderPlane({
  position,
  color1 = "#ff5722",
  color2 = "#ffffff",
}: {
  position: [number, number, number]
  color1?: string
  color2?: string
}) {
  const mesh = useRef<THREE.Mesh>(null)

  const uniforms = useMemo(
    () => ({
      time: { value: 0 },
      intensity: { value: 1.0 },
      color1: { value: new THREE.Color(color1) },
      color2: { value: new THREE.Color(color2) },
    }),
    [color1, color2],
  )

  useFrame((state) => {
    if (mesh.current) {
      uniforms.time.value = state.clock.elapsedTime
      uniforms.intensity.value = 1.0 + Math.sin(state.clock.elapsedTime * 2) * 0.3
    }
  })

  return (
    <mesh ref={mesh} position={position}>
      <planeGeometry args={[2, 2, 32, 32]} />
      <shaderMaterial
        uniforms={uniforms}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        transparent
        side={THREE.DoubleSide}
      />
    </mesh>
  )
}

export function EnergyRing({
  radius = 1,
  position = [0, 0, 0],
}: {
  radius?: number
  position?: [number, number, number]
}) {
  const mesh = useRef<THREE.Mesh>(null)

  useFrame((state) => {
    if (mesh.current) {
      mesh.current.rotation.z = state.clock.elapsedTime
      ;(mesh.current.material as THREE.MeshBasicMaterial).opacity =
        0.5 + Math.sin(state.clock.elapsedTime * 3) * 0.3
    }
  })

  return (
    <mesh ref={mesh} position={position}>
      <ringGeometry args={[radius * 0.8, radius, 32]} />
      <meshBasicMaterial color="#ff5722" transparent opacity={0.6} side={THREE.DoubleSide} />
    </mesh>
  )
}

// --- Demo ---

export default function DemoOne() {
  const [intensity, setIntensity] = useState(1.5)
  const [speed, setSpeed] = useState(1.0)
  const [isInteracting, setIsInteracting] = useState(false)
  const [activeEffect, setActiveEffect] = useState("mesh")
  const [baseColor, setBaseColor] = useState("#1d1d1d")
  return (
    <div className={s.wrapper}>
      {activeEffect === "mesh" && (
        <div className={s.halfRes}>
          <MeshGradient
            className={s.fillAbsolute}
            colors={[baseColor, "#1a1a1a", "#333333", "#ffffff"]}
            speed={speed}
          />
        </div>
      )}

      {activeEffect === "dots" && (
        <div className={s.halfRes}>
          <div className={s.fillAbsoluteBlack}>
            <DotOrbit
              style={{ width: "100%", height: "100%" }}
              dotColor="#333333"
              orbitColor="#1a1a1a"
              speed={speed}
              intensity={intensity}
            />
          </div>
        </div>
      )}

      {activeEffect === "combined" && (
        <div className={s.halfRes}>
          <MeshGradient
            className={s.fillAbsolute}
            colors={["#000000", "#1a1a1a", "#333333", "#ffffff"]}
            speed={speed * 0.5}
            wireframe="true"
          />
          <div className={s.fillAbsoluteOpacity}>
            <DotOrbit
              style={{ width: "100%", height: "100%" }}
              dotColor="#333333"
              orbitColor="#1a1a1a"
              speed={speed * 1.5}
              intensity={intensity * 0.8}
            />
          </div>
        </div>
      )}

      {/* UI Overlay */}
      <div className={s.overlay}>
        {/* Header */}
        <div className={s.topLeft}></div>

        {/* Effect Controls */}
        <div className={s.bottomLeft}>
          <label className={s.colorPickerLabel}>
            <span>Shader-Grundfarbe</span>
            <div className={s.colorPickerRow}>
              <input
                type="color"
                value={baseColor}
                onChange={e => setBaseColor(e.target.value)}
                className={s.colorInput}
              />
              <span className={s.colorHex}>{baseColor}</span>
            </div>
          </label>
        </div>

        {/* Parameter Controls */}
        <div className={s.bottomRight}></div>

        {/* Status indicator */}
        <div className={s.topRight}></div>
      </div>

      {/* Lighting overlay effects */}
      <div className={s.overlay}>
        <div
          className={s.blob1}
          style={{ animationDuration: `${3 / speed}s` }}
        />
        <div
          className={s.blob2}
          style={{ animationDuration: `${2 / speed}s`, animationDelay: "1s" }}
        />
        <div
          className={s.blob3}
          style={{ animationDuration: `${4 / speed}s`, animationDelay: "0.5s" }}
        />
      </div>

    </div>
  )
}
