'use client'

import { Suspense, useRef, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Float, RoundedBox } from '@react-three/drei'
import * as THREE from 'three'

function KanbanCards() {
  const grup = useRef<THREE.Group>(null)
  const target = useRef({ x: 0, y: 0 })

  useFrame((state) => {
    if (!grup.current) return
    grup.current.rotation.y += 0.003

    target.current.x = state.pointer.x * 0.25
    target.current.y = state.pointer.y * 0.15
    grup.current.rotation.x += (target.current.y - grup.current.rotation.x) * 0.04
    grup.current.rotation.z += (target.current.x - grup.current.rotation.z) * 0.04
  })

  return (
    <Float speed={1.2} rotationIntensity={0.25} floatIntensity={0.6}>
      <group ref={grup}>
        {/* Card utama — besar, navy gelap */}
        <mesh rotation={[0.2, 0.1, 0.05]} position={[0, 0.15, 0]} castShadow>
          <boxGeometry args={[2.6, 1.6, 0.07]} />
          <meshStandardMaterial color="#1e3a8a" roughness={0.12} metalness={0.55} />
        </mesh>

        {/* Garis header card utama */}
        <mesh position={[0, 0.57, 0.04]}>
          <boxGeometry args={[2.3, 0.18, 0.01]} />
          <meshStandardMaterial color="#2563eb" roughness={0.1} metalness={0.6} />
        </mesh>

        {/* Bar progress di card utama */}
        <mesh position={[-0.4, 0.18, 0.04]}>
          <boxGeometry args={[1.2, 0.09, 0.01]} />
          <meshStandardMaterial color="#60a5fa" roughness={0.2} />
        </mesh>
        <mesh position={[0.55, 0.18, 0.04]}>
          <boxGeometry args={[0.4, 0.09, 0.01]} />
          <meshStandardMaterial color="#1d4ed8" roughness={0.2} />
        </mesh>

        {/* Card kedua — medium blue, belakang-kanan */}
        <mesh rotation={[-0.05, 0.25, -0.1]} position={[0.65, -0.55, -0.45]} castShadow>
          <boxGeometry args={[2.1, 1.3, 0.07]} />
          <meshStandardMaterial color="#1d4ed8" roughness={0.15} metalness={0.5} />
        </mesh>

        {/* Garis header card kedua */}
        <mesh rotation={[-0.05, 0.25, -0.1]} position={[0.65, -0.1, -0.41]}>
          <boxGeometry args={[1.8, 0.16, 0.01]} />
          <meshStandardMaterial color="#3b82f6" roughness={0.1} />
        </mesh>

        {/* Card ketiga — biru lebih terang, depan-kiri */}
        <mesh rotation={[0.15, -0.2, 0.12]} position={[-0.85, 0.7, 0.35]} castShadow>
          <boxGeometry args={[1.55, 0.95, 0.07]} />
          <meshStandardMaterial color="#2563eb" roughness={0.2} metalness={0.45} />
        </mesh>

        {/* Garis header card ketiga */}
        <mesh rotation={[0.15, -0.2, 0.12]} position={[-0.85, 0.98, 0.39]}>
          <boxGeometry args={[1.3, 0.14, 0.01]} />
          <meshStandardMaterial color="#60a5fa" roughness={0.1} />
        </mesh>

        {/* Elemen kecil melayang — mewakili task/notifikasi */}
        {ELEMEN.map((e, i) => (
          <RoundedBox key={i} args={[e.w, e.h, e.d]} radius={0.04} position={e.pos}>
            <meshStandardMaterial color={e.warna} roughness={0.3} metalness={0.2} />
          </RoundedBox>
        ))}
      </group>
    </Float>
  )
}

const ELEMEN: { pos: [number, number, number]; w: number; h: number; d: number; warna: string }[] = [
  { pos: [1.75, 0.95, 0.1],   w: 0.55, h: 0.22, d: 0.08, warna: '#60a5fa' },
  { pos: [-1.65, -0.5, 0.25], w: 0.6,  h: 0.22, d: 0.08, warna: '#3b82f6' },
  { pos: [1.15, -1.15, 0.55], w: 0.45, h: 0.18, d: 0.08, warna: '#93c5fd' },
  { pos: [-0.85, 1.35, -0.2], w: 0.5,  h: 0.18, d: 0.08, warna: '#1d4ed8' },
]

export default function KebabHero() {
  const [siap, setSiap] = useState(false)

  return (
    <div className="absolute inset-0">
      <Canvas
        style={{ width: '100%', height: '100%', display: 'block' }}
        camera={{ position: [0, 0, 6.5], fov: 40 }}
        dpr={[1, 1.5]}
        onCreated={() => setSiap(true)}
        gl={{ antialias: true, powerPreference: 'low-power' }}
      >
        <ambientLight intensity={0.45} />
        <directionalLight position={[4, 5, 5]} intensity={1.3} castShadow />
        <pointLight position={[-3, -2, 3]} intensity={0.6} color="#60a5fa" />
        <pointLight position={[3, 3, -2]} intensity={0.3} color="#bfdbfe" />
        <Suspense fallback={null}>
          <KanbanCards />
        </Suspense>
      </Canvas>
      <div
        className={`pointer-events-none absolute inset-0 bg-gradient-to-br from-maroon-950/50 via-transparent to-transparent transition-opacity duration-700 ${
          siap ? 'opacity-100' : 'opacity-0'
        }`}
      />
    </div>
  )
}
