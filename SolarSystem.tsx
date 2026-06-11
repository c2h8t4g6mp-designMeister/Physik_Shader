"use client"

import { useRef, useEffect, useState } from "react"
import { Canvas, useFrame, useThree } from "@react-three/fiber"
import { Physics, RigidBody, BallCollider, CuboidCollider, useRapier } from "@react-three/rapier"
import type { RapierRigidBody } from "@react-three/rapier"
import * as THREE from "three"
import s from "./SolarSystem.module.css"

const ORANGE_PLANET = "#ff8e05"

const BODIES = [
  { id: "sun",     color: "#fcff5a",     r: 1.80, x:  0.0, y:  0.0 },
  { id: "mercury", color: "#0E3F63",     r: 0.38, x: -4.5, y:  1.5 },
  { id: "venus",   color: "#ff4a7d",     r: 0.55, x:  3.5, y: -3.0 },
  { id: "earth",   color: "#59e29b",     r: 0.60, x: -2.5, y: -4.5 },
  { id: "mars",    color: ORANGE_PLANET, r: 0.45, x:  5.5, y:  2.0 },
  { id: "jupiter", color: "#ff9faf",     r: 0.90, x: -5.5, y: -1.5 },
  { id: "saturn",  color: "#99f1e8",     r: 0.75, x:  2.0, y:  5.0 },
  { id: "neptune", color: "#c9fffa",     r: 0.50, x: -4.5, y:  4.0 },
] as const

type Mode = "reset" | "gravity" | "solarwind" | "supernova"

function OrbitRing({ radius }: { radius: number }) {
  return (
    <mesh>
      <ringGeometry args={[radius - 0.015, radius + 0.015, 64]} />
      <meshBasicMaterial color="#ffffff" transparent opacity={0.07} side={THREE.DoubleSide} />
    </mesh>
  )
}

function Walls() {
  const { size } = useThree()
  // Exakte Berechnung aus Kamera-Parametern (position z=18, fov=50)
  const hh = Math.tan((50 / 2) * (Math.PI / 180)) * 18  // ≈ 8.39
  const hw = hh * (size.width / size.height)
  const t = 5   // dicke Wände verhindert Tunneln geometrisch
  const d = 6   // Tiefe der Wände (Objekte liegen bei z=0)

  // Beim ersten Render kann size.height = 0 sein → hw wird Infinity/NaN → Rapier crasht.
  // Solange keine gültigen Masse vorliegen, nichts rendern.
  if (!isFinite(hw) || !isFinite(hh) || hw <= 0 || hh <= 0) return null

  // Wände liegen AUSSERHALB des Viewports: Innenfläche exakt an der sichtbaren Kante.
  // CuboidCollider-args sind Halb-Masse: [halfX, halfY, halfZ]
  return (
    <>
      {/* Unten: Innenfläche bei y = -hh */}
      <RigidBody type="fixed" position={[0, -(hh + t / 2), 0]}>
        <CuboidCollider args={[hw + t, t / 2, d]} />
      </RigidBody>
      {/* Oben: Innenfläche bei y = +hh */}
      <RigidBody type="fixed" position={[0, hh + t / 2, 0]}>
        <CuboidCollider args={[hw + t, t / 2, d]} />
      </RigidBody>
      {/* Links: Innenfläche bei x = -hw */}
      <RigidBody type="fixed" position={[-(hw + t / 2), 0, 0]}>
        <CuboidCollider args={[t / 2, hh + t, d]} />
      </RigidBody>
      {/* Rechts: Innenfläche bei x = +hw */}
      <RigidBody type="fixed" position={[hw + t / 2, 0, 0]}>
        <CuboidCollider args={[t / 2, hh + t, d]} />
      </RigidBody>
    </>
  )
}

function Scene({ mode, resetToken }: { mode: Mode; resetToken: number }) {
  const refs = useRef<(RapierRigidBody | null)[]>(BODIES.map(() => null))
  const { world } = useRapier()

  // Schwerkraft direkt auf die Physik-Welt schreiben
  useEffect(() => {
    world.gravity.x = 0
    world.gravity.y = mode === "gravity" ? -9.0 : 0
    world.gravity.z = 0
  }, [mode, world])

  // Beim Moduswechsel aufgelaufene Kräfte löschen
  useEffect(() => {
    refs.current.forEach(b => b?.resetForces(true))
  }, [mode])

  // Positionen + Geschwindigkeiten zurücksetzen
  useEffect(() => {
    BODIES.forEach(({ x, y }, i) => {
      const b = refs.current[i]
      if (!b) return
      b.setTranslation({ x, y, z: 0 }, true)
      b.setLinvel({ x: 0, y: 0, z: 0 }, true)
      b.setAngvel({ x: 0, y: 0, z: 0 }, true)
    })
  }, [resetToken])

  // Solarwind: applyImpulse statt addForce — kein Kraft-Akkumulator, kein Überlauf
  useFrame(() => {
    if (mode === "solarwind") {
      refs.current.forEach(b => b?.applyImpulse({ x: 0.12, y: 0, z: 0 }, true))
    } else if (mode === "supernova") {
      refs.current.forEach(b => {
        if (!b) return
        const pos = b.translation()
        const len = Math.sqrt(pos.x * pos.x + pos.y * pos.y)
        if (len < 0.001) {
          // Körper exakt im Zentrum (Sonne): kleiner Zufalls-Kick
          b.applyImpulse({ x: (Math.random() - 0.5) * 0.1, y: (Math.random() - 0.5) * 0.1, z: 0 }, true)
        } else {
          b.applyImpulse({ x: (pos.x / len) * 0.15, y: (pos.y / len) * 0.15, z: 0 }, true)
        }
      })
    }
  })

  return (
    <>
      <Walls />
      {BODIES.slice(1).map(b => (
        <OrbitRing key={b.id + "-ring"} radius={Math.sqrt(b.x * b.x + b.y * b.y)} />
      ))}
      {BODIES.map((b, i) => (
        <RigidBody
          key={b.id}
          ref={el => { refs.current[i] = el }}
          position={[b.x, b.y, 0]}
          linearDamping={0.4}
          angularDamping={0.8}
          restitution={0.35}
          friction={0.2}
          ccd={true}
        >
          <BallCollider args={[b.r]} />
          <mesh>
            <sphereGeometry args={[b.r, 64, 32]} />
            <meshStandardMaterial
              color={b.color}
              emissive={b.color}
              emissiveIntensity={b.id === "sun" ? 0.45 : 0.06}
              roughness={0.65}
              metalness={0.05}
            />
          </mesh>
        </RigidBody>
      ))}
    </>
  )
}

export default function SolarSystem() {
  const [mode, setMode] = useState<Mode>("reset")
  const [resetToken, setResetToken] = useState(0)

  function handleReset()     { setMode("reset");    setResetToken(t => t + 1) }
  function handleGravity()   { setMode("gravity") }
  function handleSolarwind() { setMode("solarwind") }
  function handleSupernova() { setMode("supernova") }

  return (
    <>
      <div className={s.controls}>
        <button className={`${s.btn} ${mode === "reset"     ? s.active : ""}`} onClick={handleReset}>
          Start / Reset
        </button>
        <button className={`${s.btn} ${mode === "gravity"   ? s.active : ""}`} onClick={handleGravity}>
          Erdanziehung
        </button>
        <button className={`${s.btn} ${mode === "solarwind" ? s.active : ""}`} onClick={handleSolarwind}>
          Solarwind
        </button>
        <button className={`${s.btn} ${mode === "supernova" ? s.active : ""}`} onClick={handleSupernova}>
          Supernova
        </button>
      </div>

      <div className={s.container}>
        {/* frameloop="always": kein Pause/Zeitsprung-Problem.
            Tabs stellen sicher, dass nie zwei WebGL-Kontexte gleichzeitig laufen. */}
        <Canvas
          camera={{ position: [0, 0, 18], fov: 50 }}
          dpr={[1, 2]}
          frameloop="always"
          gl={{ antialias: true }}
        >
          <color attach="background" args={["#08080f"]} />
          <ambientLight intensity={0.5} />
          <pointLight position={[0, 0, 10]} intensity={2.5} color="#fffef0" />

          {/* timeStep={1/60}: fixer Schritt verhindert riesige dt-Sprünge */}
          <Physics gravity={[0, 0, 0]} timeStep={1 / 60}>
            <Scene mode={mode} resetToken={resetToken} />
          </Physics>
        </Canvas>
      </div>
    </>
  )
}
