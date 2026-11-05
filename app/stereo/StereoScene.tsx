'use client'
import { useEffect, useMemo, useRef } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { C, type Scene, type SceneBody, type SceneRing, type V3 } from '@/lib/stereo/lessons'

// 3D-сцена урока стереометрии: точки, отрезки, плоскости из описания Scene.
// Фигуру можно вращать и приближать пальцем или мышью. Подписи — обычный
// HTML поверх холста: каждый кадр переводим их 3D-координаты в экранные.

const DEFAULT_CAMERA: V3 = [4.2, 3.2, 5.2]
const v = (p: V3) => new THREE.Vector3(...p)

// Отрезок — тонкий цилиндр (линии WebGL всегда толщиной 1 px)
function Rod({ a, b, color, r, dashed }: { a: V3; b: V3; color: string; r: number; dashed?: boolean }) {
  const parts = useMemo(() => {
    const A = v(a), B = v(b), n = dashed ? Math.max(3, Math.round(A.distanceTo(B) / 0.22)) : 1
    return Array.from({ length: n }, (_, i) => {
      const p = A.clone().lerp(B, i / n), q = A.clone().lerp(B, (i + (dashed ? 0.55 : 1)) / n)
      const len = p.distanceTo(q), mid = p.clone().add(q).multiplyScalar(0.5)
      const quat = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), q.clone().sub(p).normalize())
      return { len, mid, quat }
    })
  }, [a, b, dashed])
  return (
    <>
      {parts.map((s, i) => (
        <mesh key={i} position={s.mid} quaternion={s.quat}>
          <cylinderGeometry args={[r, r, s.len, 10]} />
          <meshStandardMaterial color={color} roughness={0.5} />
        </mesh>
      ))}
    </>
  )
}

function Plane({ corners, color, opacity = 0.22 }: { corners: V3[]; color: string; opacity?: number }) {
  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry().setFromPoints(corners.map(v))
    // Выпуклый многоугольник — веером треугольников из первой вершины
    g.setIndex(corners.slice(2).flatMap((_, i) => [0, i + 1, i + 2]))
    g.computeVertexNormals()
    return g
  }, [corners])
  return (
    <>
      <mesh geometry={geo} renderOrder={-1}>
        <meshBasicMaterial color={color} transparent opacity={opacity} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>
      {corners.map((c, i) => <Rod key={i} a={c} b={corners[(i + 1) % corners.length]} color={color} r={0.008} />)}
    </>
  )
}

// Тело вращения: полупрозрачная поверхность (цилиндр, конус, шар)
function Body({ b }: { b: SceneBody }) {
  const color = b.color ?? C.blue, opacity = b.opacity ?? 0.2
  const mat = <meshStandardMaterial color={color} transparent opacity={opacity} side={THREE.DoubleSide} depthWrite={false} roughness={0.6} />
  if (b.kind === 'sphere') return <mesh position={b.c} renderOrder={-1}><sphereGeometry args={[b.r, 48, 32]} />{mat}</mesh>
  const h = b.h ?? 1
  return (
    <mesh position={[b.c[0], b.c[1] + h / 2, b.c[2]]} renderOrder={-1}>
      <cylinderGeometry args={[b.rTop ?? b.r, b.r, h, 64, 1, true]} />
      {mat}
    </mesh>
  )
}

// Окружность из коротких отрезков; fill — полупрозрачный круг внутри
function Ring({ g }: { g: SceneRing }) {
  const n = 64, color = g.color ?? C.blue
  const pts: V3[] = Array.from({ length: n }, (_, i) => [g.c[0] + g.r * Math.cos((2 * Math.PI * i) / n), g.c[1], g.c[2] + g.r * Math.sin((2 * Math.PI * i) / n)])
  return (
    <>
      {pts.map((p, i) => <Rod key={i} a={p} b={pts[(i + 1) % n]} color={color} r={0.014} />)}
      {g.fill ? (
        <mesh position={g.c} rotation={[-Math.PI / 2, 0, 0]} renderOrder={-1}>
          <circleGeometry args={[g.r, 64]} />
          <meshBasicMaterial color={color} transparent opacity={g.fill} side={THREE.DoubleSide} depthWrite={false} />
        </mesh>
      ) : null}
    </>
  )
}

// Управление камерой: вращение и приближение, без сдвига. resetKey — вернуть вид.
function Controls({ camera: start, resetKey }: { camera: V3; resetKey: number }) {
  const { camera, gl } = useThree()
  const ctrl = useRef<OrbitControls | null>(null)
  useEffect(() => {
    const c = new OrbitControls(camera, gl.domElement)
    c.enableDamping = true
    c.enablePan = false
    c.minDistance = 3
    c.maxDistance = 14
    ctrl.current = c
    return () => c.dispose()
  }, [camera, gl])
  useEffect(() => {
    camera.position.set(...start)
    camera.lookAt(0, 0, 0)
    ctrl.current?.target.set(0, 0, 0)
    ctrl.current?.update()
  }, [camera, start, resetKey])
  useFrame(() => ctrl.current?.update())
  return null
}

type Label = { at: V3; text: string; color: string }

// Перевод 3D-точек подписей в экранные координаты
function Labels({ labels, refs }: { labels: Label[]; refs: React.RefObject<(HTMLSpanElement | null)[]> }) {
  const { camera, size } = useThree()
  const tmp = useMemo(() => new THREE.Vector3(), [])
  useFrame(() => {
    labels.forEach((l, i) => {
      const el = refs.current?.[i]
      if (!el) return
      tmp.set(...l.at).project(camera)
      el.style.transform = `translate(${((tmp.x + 1) / 2) * size.width}px, ${((1 - tmp.y) / 2) * size.height}px) translate(-50%, -50%)`
      el.style.opacity = tmp.z < 1 ? '1' : '0'
    })
  })
  return null
}

export default function StereoScene({ scene, resetKey }: { scene: Scene; resetKey: number }) {
  // Подписи: точки — чуть выше точки, прямые — у конца, плоскости — у угла
  const labels: Label[] = useMemo(() => {
    const out: Label[] = []
    for (const p of scene.points ?? []) if (p.label) out.push({ at: p.dot === false ? p.at : [p.at[0] + 0.14, p.at[1] + 0.2, p.at[2]], text: p.label, color: p.color ?? '#e2e8f0' })
    for (const l of scene.lines ?? []) if (l.label) { const A = v(l.a), B = v(l.b); const at = A.lerp(B, 0.92); out.push({ at: [at.x, at.y + 0.18, at.z], text: l.label, color: l.color ?? C.blue }) }
    for (const pl of scene.planes ?? []) if (pl.label) { const [a, , c] = pl.corners; const at = v(a).lerp(v(c), 0.1); out.push({ at: [at.x, at.y, at.z], text: pl.label, color: pl.color ?? C.blue }) }
    return out
  }, [scene])
  const refs = useRef<(HTMLSpanElement | null)[]>([])

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <Canvas camera={{ position: scene.camera ?? DEFAULT_CAMERA, fov: 40 }} dpr={[1, 2]} style={{ touchAction: 'none' }}>
        <ambientLight intensity={0.8} />
        <directionalLight position={[4, 8, 6]} intensity={1.1} />
        <Controls camera={scene.camera ?? DEFAULT_CAMERA} resetKey={resetKey} />
        {(scene.bodies ?? []).map((b, i) => <Body key={`b${i}`} b={b} />)}
        {(scene.rings ?? []).map((g, i) => <Ring key={`r${i}`} g={g} />)}
        {(scene.planes ?? []).map((p, i) => <Plane key={`p${i}`} corners={p.corners} color={p.color ?? C.blue} opacity={p.opacity} />)}
        {(scene.lines ?? []).map((l, i) => <Rod key={`l${i}`} a={l.a} b={l.b} color={l.color ?? C.blue} r={l.thin ? 0.014 : 0.03} dashed={l.dashed} />)}
        {(scene.points ?? []).filter(p => p.dot !== false).map((p, i) => (
          <mesh key={`t${i}`} position={p.at}>
            <sphereGeometry args={[0.075, 20, 20]} />
            <meshStandardMaterial color={p.color ?? '#e2e8f0'} />
          </mesh>
        ))}
        <Labels labels={labels} refs={refs} />
      </Canvas>
      {labels.map((l, i) => (
        <span key={i} ref={el => { refs.current[i] = el }}
          style={{ position: 'absolute', left: 0, top: 0, pointerEvents: 'none', fontWeight: 800, fontSize: 15, fontStyle: /^[a-zα-ω]$/.test(l.text) ? 'italic' : 'normal', color: l.color, textShadow: '0 0 4px rgba(0,0,0,0.85), 0 0 2px rgba(0,0,0,0.85)', whiteSpace: 'nowrap' }}>
          {l.text}
        </span>
      ))}
    </div>
  )
}
