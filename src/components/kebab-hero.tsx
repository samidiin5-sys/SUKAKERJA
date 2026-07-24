'use client'

import { Suspense, useRef, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Float, RoundedBox } from '@react-three/drei'
import * as THREE from 'three'

// Bentuk 3D abstrak (bukan model kebab detail — itu butuh file .glb asli
// dari desainer). Komposisi ini memakai primitif dasar Three.js supaya
// tetap ringan (tidak ada aset eksternal, tidak ada HDRI yang di-fetch).
function BentukUtama() {
  const grup = useRef<THREE.Group>(null)
  const target = useRef({ x: 0, y: 0 })

  useFrame((state) => {
    if (!grup.current) return
    grup.current.rotation.y += 0.003

    // Parallax lembut mengikuti posisi pointer.
    target.current.x = state.pointer.x * 0.25
    target.current.y = state.pointer.y * 0.15
    grup.current.rotation.x += (target.current.y - grup.current.rotation.x) * 0.04
    grup.current.rotation.z += (target.current.x - grup.current.rotation.z) * 0.04
  })

  return (
    <Float speed={1.4} rotationIntensity={0.3} floatIntensity={0.8}>
      <group ref={grup}>
        {/* "Gulungan" utama — silinder memanjang miring, representasi abstrak wrap */}
        <mesh rotation={[0, 0, Math.PI / 2.4]} castShadow receiveShadow>
          <capsuleGeometry args={[0.85, 1.9, 8, 24]} />
          <meshStandardMaterial color="#c9711f" roughness={0.35} metalness={0.1} />
        </mesh>

        {/* Lapisan dalam, sedikit lebih kecil, warna maroon */}
        <mesh rotation={[0, 0, Math.PI / 2.4]} scale={0.72}>
          <capsuleGeometry args={[0.85, 1.9, 8, 24]} />
          <meshStandardMaterial color="#7a2b1c" roughness={0.5} metalness={0.05} />
        </mesh>

        {/* Potongan-potongan kecil melayang di sekitarnya */}
        {POTONGAN.map((p, i) => (
          <RoundedBox key={i} args={[p.s, p.s, p.s]} radius={p.s * 0.25} position={p.pos}>
            <meshStandardMaterial color={p.warna} roughness={0.4} />
          </RoundedBox>
        ))}
      </group>
    </Float>
  )
}

const POTONGAN: { pos: [number, number, number]; s: number; warna: string }[] = [
  { pos: [1.6, 0.9, -0.4], s: 0.22, warna: '#e6a25c' },
  { pos: [-1.7, -0.6, 0.3], s: 0.28, warna: '#8f3520' },
  { pos: [1.2, -1.1, 0.6], s: 0.18, warna: '#c9711f' },
  { pos: [-1.1, 1.2, -0.2], s: 0.2, warna: '#e6a25c' },
]

export default function KebabHero() {
  const [siap, setSiap] = useState(false)

  return (
    <div className="absolute inset-0">
      <Canvas
        style={{ width: '100%', height: '100%', display: 'block' }}
        camera={{ position: [0, 0, 6], fov: 42 }}
        dpr={[1, 1.5]}
        onCreated={() => setSiap(true)}
        gl={{ antialias: true, powerPreference: 'low-power' }}
      >
        <ambientLight intensity={0.6} />
        <directionalLight position={[3, 4, 5]} intensity={1.1} castShadow />
        <pointLight position={[-3, -2, 2]} intensity={0.4} color="#db8a3c" />
        <Suspense fallback={null}>
          <BentukUtama />
        </Suspense>
      </Canvas>
      <div
        className={`pointer-events-none absolute inset-0 bg-gradient-to-br from-maroon-950/40 via-transparent to-transparent transition-opacity duration-700 ${
          siap ? 'opacity-100' : 'opacity-0'
        }`}
      />
    </div>
  )
}
