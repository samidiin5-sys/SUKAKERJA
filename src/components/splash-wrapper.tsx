'use client'

import { useState, useEffect, useCallback } from 'react'
import dynamic from 'next/dynamic'

const SplashScreen = dynamic(() => import('./splash-screen'), { ssr: false })

export default function SplashWrapper({ children }: { children: React.ReactNode }) {
  const [tampilSplash, setTampilSplash] = useState(false)

  useEffect(() => {
    const sudahTampil = sessionStorage.getItem('sk_splash')
    if (!sudahTampil) {
      setTampilSplash(true)
      sessionStorage.setItem('sk_splash', '1')
    }
  }, [])

  const handleSelesai = useCallback(() => setTampilSplash(false), [])

  return (
    <>
      {tampilSplash && <SplashScreen onSelesai={handleSelesai} />}
      {children}
    </>
  )
}
