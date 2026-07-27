'use client'

import { useRef } from 'react'
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion'

interface Props {
  children: React.ReactNode
  className?: string
  tiltDegree?: number
  perspective?: number
}

export default function KartuTilt({
  children,
  className = '',
  tiltDegree = 10,
  perspective = 700,
}: Props) {
  const ref = useRef<HTMLDivElement>(null)

  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)

  const rotateX = useSpring(
    useTransform(mouseY, [-0.5, 0.5], [tiltDegree, -tiltDegree]),
    { stiffness: 350, damping: 28 }
  )
  const rotateY = useSpring(
    useTransform(mouseX, [-0.5, 0.5], [-tiltDegree, tiltDegree]),
    { stiffness: 350, damping: 28 }
  )
  const scale = useSpring(1, { stiffness: 380, damping: 26 })

  function onMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    if (!ref.current) return
    const rect = ref.current.getBoundingClientRect()
    mouseX.set((e.clientX - rect.left - rect.width / 2) / rect.width)
    mouseY.set((e.clientY - rect.top - rect.height / 2) / rect.height)
    scale.set(1.025)
  }

  function onMouseLeave() {
    mouseX.set(0)
    mouseY.set(0)
    scale.set(1)
  }

  function onMouseDown() { scale.set(0.965) }
  function onMouseUp()   { scale.set(1.025) }

  return (
    <motion.div
      ref={ref}
      style={{ rotateX, rotateY, scale, transformPerspective: perspective }}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
      onMouseDown={onMouseDown}
      onMouseUp={onMouseUp}
      className={className}
    >
      {children}
    </motion.div>
  )
}
