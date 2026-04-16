'use client'

import { useEffect, useRef } from 'react'
import * as THREE from 'three'

export default function ParticleCanvas() {
  const mountRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const mount = mountRef.current
    if (!mount) return

    // Scene
    const scene    = new THREE.Scene()
    const camera   = new THREE.PerspectiveCamera(60, mount.clientWidth / mount.clientHeight, 0.1, 1000)
    camera.position.z = 5

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setSize(mount.clientWidth, mount.clientHeight)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setClearColor(0x000000, 0)
    mount.appendChild(renderer.domElement)

    // Particle geometry
    const COUNT    = 120
    const positions = new Float32Array(COUNT * 3)
    const velocities: { vx: number; vy: number; vz: number }[] = []

    for (let i = 0; i < COUNT; i++) {
      positions[i * 3]     = (Math.random() - 0.5) * 12
      positions[i * 3 + 1] = (Math.random() - 0.5) * 8
      positions[i * 3 + 2] = (Math.random() - 0.5) * 4
      velocities.push({
        vx: (Math.random() - 0.5) * 0.003,
        vy: (Math.random() - 0.5) * 0.003,
        vz: (Math.random() - 0.5) * 0.001,
      })
    }

    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))

    const mat = new THREE.PointsMaterial({
      color: 0x1e90ff,
      size: 0.06,
      transparent: true,
      opacity: 0.75,
      sizeAttenuation: true,
    })

    const points = new THREE.Points(geo, mat)
    scene.add(points)

    // Line connections
    const lineMat  = new THREE.LineBasicMaterial({ color: 0x1e90ff, transparent: true, opacity: 0.12 })
    let linesMesh: THREE.LineSegments | null = null

    const updateLines = () => {
      const pos    = geo.attributes.position.array as Float32Array
      const linePositions: number[] = []
      const DIST   = 3.0

      for (let i = 0; i < COUNT; i++) {
        for (let j = i + 1; j < COUNT; j++) {
          const dx = pos[i * 3] - pos[j * 3]
          const dy = pos[i * 3 + 1] - pos[j * 3 + 1]
          const dz = pos[i * 3 + 2] - pos[j * 3 + 2]
          const d  = Math.sqrt(dx * dx + dy * dy + dz * dz)
          if (d < DIST) {
            linePositions.push(
              pos[i * 3], pos[i * 3 + 1], pos[i * 3 + 2],
              pos[j * 3], pos[j * 3 + 1], pos[j * 3 + 2]
            )
          }
        }
      }

      if (linesMesh) scene.remove(linesMesh)
      const lineGeo = new THREE.BufferGeometry()
      lineGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(linePositions), 3))
      linesMesh = new THREE.LineSegments(lineGeo, lineMat)
      scene.add(linesMesh)
    }

    // Mouse parallax
    let mx = 0, my = 0
    const onMouseMove = (e: MouseEvent) => {
      mx = (e.clientX / window.innerWidth - 0.5) * 0.3
      my = (e.clientY / window.innerHeight - 0.5) * 0.2
    }
    window.addEventListener('mousemove', onMouseMove)

    // Resize
    const onResize = () => {
      if (!mount) return
      camera.aspect = mount.clientWidth / mount.clientHeight
      camera.updateProjectionMatrix()
      renderer.setSize(mount.clientWidth, mount.clientHeight)
    }
    window.addEventListener('resize', onResize)

    // Animation loop
    let frameId: number
    let frame = 0

    const animate = () => {
      frameId = requestAnimationFrame(animate)
      frame++

      const pos = geo.attributes.position.array as Float32Array

      for (let i = 0; i < COUNT; i++) {
        pos[i * 3]     += velocities[i].vx
        pos[i * 3 + 1] += velocities[i].vy
        pos[i * 3 + 2] += velocities[i].vz

        if (Math.abs(pos[i * 3])     > 6)  velocities[i].vx *= -1
        if (Math.abs(pos[i * 3 + 1]) > 4)  velocities[i].vy *= -1
        if (Math.abs(pos[i * 3 + 2]) > 2)  velocities[i].vz *= -1
      }

      geo.attributes.position.needsUpdate = true

      // Rebuild lines every 3 frames for performance
      if (frame % 3 === 0) updateLines()

      // Camera drift
      camera.position.x += (mx - camera.position.x) * 0.02
      camera.position.y += (-my - camera.position.y) * 0.02
      camera.lookAt(scene.position)

      renderer.render(scene, camera)
    }

    animate()

    return () => {
      cancelAnimationFrame(frameId)
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('resize', onResize)
      renderer.dispose()
      if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement)
    }
  }, [])

  return (
    <div
      ref={mountRef}
      style={{ position: 'absolute', inset: 0, zIndex: 0 }}
      aria-hidden="true"
    />
  )
}
