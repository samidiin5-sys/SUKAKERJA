'use client'

import { Suspense, useEffect, useState, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Float, RoundedBox } from '@react-three/drei'
import * as THREE from 'three'

function KartuSplash() {
  const grup = useRef<THREE.Group>(null)

  useFrame((state) => {
    if (!grup.current) return
    grup.current.rotation.y = state.clock.elapsedTime * 0.35
    grup.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.25) * 0.12
  })

  return (
    <Float speed={0.8} rotationIntensity={0.15} floatIntensity={0.6}>
      <group ref={grup}>
        {/* Kartu utama — navy gelap */}
        <mesh position={[0, 0, 0]} rotation={[0.1, 0, 0.05]}>
          <boxGeometry args={[3.2, 1.9, 0.08]} />
          <meshStandardMaterial color="#1e3a8a" roughness={0.1} metalness={0.65} />
        </mesh>
        {/* Header bar kartu utama */}
        <mesh position={[0, 0.7, 0.05]}>
          <boxGeometry args={[2.8, 0.22, 0.01]} />
          <meshStandardMaterial color="#2563eb" roughness={0.08} metalness={0.7} />
        </mesh>
        {/* Progress bar */}
        <mesh position={[-0.55, 0.22, 0.05]}>
          <boxGeometry args={[1.5, 0.1, 0.01]} />
          <meshStandardMaterial color="#60a5fa" roughness={0.2} />
        </mesh>
        <mesh position={[0.72, 0.22, 0.05]}>
          <boxGeometry args={[0.55, 0.1, 0.01]} />
          <meshStandardMaterial color="#1d4ed8" roughness={0.2} />
        </mesh>
        {/* Tiga garis teks simulasi */}
        {[-0.15, -0.42, -0.65].map((y, i) => (
          <mesh key={i} position={[i === 2 ? -0.4 : 0, y, 0.05]}>
            <boxGeometry args={[i === 2 ? 1.6 : 2.4, 0.06, 0.005]} />
            <meshStandardMaterial color="#3b82f6" roughness={0.3} metalness={0.3} transparent opacity={0.5 - i * 0.1} />
          </mesh>
        ))}

        {/* Kartu kedua — belakang kanan */}
        <mesh position={[1.5, -1, -0.7]} rotation={[-0.05, 0.32, -0.1]}>
          <boxGeometry args={[2.6, 1.6, 0.08]} />
          <meshStandardMaterial color="#1d4ed8" roughness={0.15} metalness={0.5} />
        </mesh>
        <mesh position={[1.5, -0.5, -0.65]} rotation={[-0.05, 0.32, -0.1]}>
          <boxGeometry args={[2.2, 0.18, 0.01]} />
          <meshStandardMaterial color="#3b82f6" roughness={0.1} />
        </mesh>

        {/* Kartu ketiga — belakang kiri */}
        <mesh position={[-1.4, 1.1, -1.1]} rotation={[0.12, -0.28, 0.12]}>
          <boxGeometry args={[2, 1.25, 0.08]} />
          <meshStandardMaterial color="#2563eb" roughness={0.2} metalness={0.45} />
        </mesh>
        <mesh position={[-1.4, 1.42, -1.05]} rotation={[0.12, -0.28, 0.12]}>
          <boxGeometry args={[1.7, 0.16, 0.01]} />
          <meshStandardMaterial color="#60a5fa" roughness={0.1} />
        </mesh>

        {/* Pills melayang */}
        <RoundedBox args={[0.65, 0.24, 0.09]} radius={0.04} position={[2.1, 1.2, 0.25]}>
          <meshStandardMaterial color="#60a5fa" roughness={0.3} metalness={0.2} />
        </RoundedBox>
        <RoundedBox args={[0.7, 0.24, 0.09]} radius={0.04} position={[-2, -0.7, 0.35]}>
          <meshStandardMaterial color="#3b82f6" roughness={0.3} metalness={0.2} />
        </RoundedBox>
        <RoundedBox args={[0.55, 0.2, 0.09]} radius={0.04} position={[1.5, -1.6, 0.7]}>
          <meshStandardMaterial color="#93c5fd" roughness={0.3} metalness={0.2} />
        </RoundedBox>
        <RoundedBox args={[0.5, 0.18, 0.09]} radius={0.04} position={[-1, 1.8, -0.3]}>
          <meshStandardMaterial color="#1d4ed8" roughness={0.3} metalness={0.2} />
        </RoundedBox>
      </group>
    </Float>
  )
}

export default function SplashScreen({ onSelesai }: { onSelesai: () => void }) {
  const [fading, setFading] = useState(false)
  const [tampil, setTampil] = useState(false)

  useEffect(() => {
    // Sedikit delay agar canvas sempat mount sebelum fade-in
    const fadeIn = setTimeout(() => setTampil(true), 50)
    const fadeOut = setTimeout(() => setFading(true), 2200)
    const selesai = setTimeout(onSelesai, 2900)
    return () => {
      clearTimeout(fadeIn)
      clearTimeout(fadeOut)
      clearTimeout(selesai)
    }
  }, [onSelesai])

  return (
    <div
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center transition-opacity duration-700 ${
        !tampil ? 'opacity-0' : fading ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
      style={{ background: '#080f1e' }}
    >
      {/* Three.js background canvas */}
      <div className="absolute inset-0">
        <Canvas
          camera={{ position: [0, 0, 7.5], fov: 42 }}
          dpr={[1, 1.5]}
          gl={{ antialias: true, powerPreference: 'low-power' }}
          style={{ width: '100%', height: '100%' }}
        >
          <ambientLight intensity={0.4} />
          <directionalLight position={[4, 5, 5]} intensity={1.2} castShadow />
          <pointLight position={[-3, -2, 3]} intensity={0.7} color="#60a5fa" />
          <pointLight position={[3, 3, -2]} intensity={0.35} color="#bfdbfe" />
          <Suspense fallback={null}>
            <KartuSplash />
          </Suspense>
        </Canvas>
      </div>

      {/* Overlay gradient atas-bawah agar logo terbaca */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at center, transparent 20%, #080f1e 80%)'
        }}
      />

      {/* Logo & branding — centered */}
      <div className="relative z-10 flex flex-col items-center gap-5">
        <div
          className="flex h-20 w-20 items-center justify-center rounded-3xl text-3xl font-black shadow-2xl"
          style={{
            background: '#f8fafc',
            color: '#1e3a8a',
            boxShadow: '0 0 40px rgba(96,165,250,0.35), 0 20px 60px rgba(8,15,30,0.6)'
          }}
        >
          SK
        </div>

        <div className="text-center">
          <p className="text-3xl font-black tracking-tight" style={{ color: '#f8fafc' }}>
            SUKAKERJA
          </p>
          <p
            className="mt-1.5 text-xs font-bold tracking-[0.35em]"
            style={{ color: '#60a5fa' }}
          >
            PORTAL KARYAWAN
          </p>
        </div>

        {/* Loading dots */}
        <div className="flex gap-1.5 mt-2">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="h-1.5 w-1.5 rounded-full animate-pulse"
              style={{
                background: '#3b82f6',
                animationDelay: `${i * 200}ms`
              }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
