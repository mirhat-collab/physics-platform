'use client'
import { useMemo, useRef } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { scroll } from './scroll-state'

// 3D-фон главной: «путешествие по физике». Сцены стоят друг за другом
// вдоль оси Z, камера летит между ними по мере прокрутки страницы
// (scroll.s: 0 — первый экран, 1…4 — главы). Только примитивы three.js —
// без моделей и текстур, поэтому грузится быстро.

const GAP = 42 // расстояние между сценами
const BLUE = new THREE.Color('#3d7bff')
const CYAN = new THREE.Color('#7fb2ff')
const WARM = new THREE.Color('#ff8a4c')

// Детерминированные «случайные» числа: звёзды и ядро атома одинаковы при каждой отрисовке
function rng(seed: number) {
  return () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// Мягкое свечение: спрайт с радиальным градиентом (вместо тяжёлой постобработки)
function useGlowTexture() {
  return useMemo(() => {
    const c = document.createElement('canvas')
    c.width = c.height = 128
    const g = c.getContext('2d')!
    const grd = g.createRadialGradient(64, 64, 0, 64, 64, 64)
    grd.addColorStop(0, 'rgba(255,255,255,1)')
    grd.addColorStop(0.25, 'rgba(255,255,255,0.45)')
    grd.addColorStop(1, 'rgba(255,255,255,0)')
    g.fillStyle = grd
    g.fillRect(0, 0, 128, 128)
    const tex = new THREE.CanvasTexture(c)
    tex.colorSpace = THREE.SRGBColorSpace
    return tex
  }, [])
}

function Glow({ color, scale, opacity = 1, position = [0, 0, 0] as [number, number, number] }: { color: THREE.Color; scale: number; opacity?: number; position?: [number, number, number] }) {
  const map = useGlowTexture()
  return (
    <sprite position={position} scale={[scale, scale, 1]}>
      <spriteMaterial map={map} color={color} transparent opacity={opacity} depthWrite={false} blending={THREE.AdditiveBlending} />
    </sprite>
  )
}

// Линия из точек: three.js Line через primitive (JSX-тег line в TypeScript конфликтует с SVG)
function Polyline({ points, color, opacity = 1, dashed = false }: { points: THREE.Vector3[]; color: THREE.ColorRepresentation; opacity?: number; dashed?: boolean }) {
  const obj = useMemo(() => {
    const geo = new THREE.BufferGeometry().setFromPoints(points)
    const mat = dashed
      ? new THREE.LineDashedMaterial({ color, dashSize: 0.12, gapSize: 0.12, transparent: true, opacity })
      : new THREE.LineBasicMaterial({ color, transparent: true, opacity })
    const line = new THREE.Line(geo, mat)
    if (dashed) line.computeLineDistances()
    return line
  }, [points, color, opacity, dashed])
  return <primitive object={obj} />
}

// Точки на сфере (раскладка «подсолнух» — ровно, без сгустков)
function spherePoints(n: number, r: number) {
  const arr = new Float32Array(n * 3)
  const golden = Math.PI * (3 - Math.sqrt(5))
  for (let i = 0; i < n; i++) {
    const y = 1 - (i / (n - 1)) * 2
    const rad = Math.sqrt(1 - y * y)
    const th = golden * i
    arr.set([Math.cos(th) * rad * r, y * r, Math.sin(th) * rad * r], i * 3)
  }
  return arr
}

function Stars() {
  const ref = useRef<THREE.Points>(null)
  const pos = useMemo(() => {
    const n = 2600
    const rand = rng(7)
    const a = new Float32Array(n * 3)
    for (let i = 0; i < n; i++) {
      a[i * 3] = (rand() - 0.5) * 120
      a[i * 3 + 1] = (rand() - 0.5) * 80
      a[i * 3 + 2] = 20 - rand() * (GAP * 5 + 60)
    }
    return a
  }, [])
  useFrame((_, dt) => { if (ref.current) ref.current.rotation.z += dt * 0.004 })
  return (
    <points ref={ref}>
      <bufferGeometry><bufferAttribute attach="attributes-position" args={[pos, 3]} /></bufferGeometry>
      <pointsMaterial size={0.09} color="#9db8ff" transparent opacity={0.7} sizeAttenuation depthWrite={false} />
    </points>
  )
}

// Глобус из светящихся точек с дугами-траекториями — первый экран и глава про гравитацию
function Globe({ radius = 3, points = 5200, arcs = true }: { radius?: number; points?: number; arcs?: boolean }) {
  const g = useRef<THREE.Group>(null)
  const pos = useMemo(() => spherePoints(points, radius), [points, radius])
  const arcLines = useMemo(() => {
    if (!arcs) return []
    const pick = (lat: number, lon: number) => new THREE.Vector3().setFromSphericalCoords(radius, (90 - lat) * Math.PI / 180, lon * Math.PI / 180)
    const pairs: [number, number, number, number][] = [[48, 70, 55, 140], [48, 70, 20, 10], [48, 70, 35, -40], [30, 110, -10, 150]]
    return pairs.map(([a, b, c, d]) => {
      const p0 = pick(a, b), p2 = pick(c, d)
      const mid = p0.clone().add(p2).multiplyScalar(0.5).normalize().multiplyScalar(radius * 1.45)
      return new THREE.QuadraticBezierCurve3(p0, mid, p2).getPoints(48)
    })
  }, [arcs, radius])
  useFrame((_, dt) => { if (g.current) g.current.rotation.y += dt * 0.08 })
  return (
    <group>
      <Glow color={BLUE} scale={radius * 4.2} opacity={0.55} />
      <group ref={g} rotation={[0.35, 0, 0.12]}>
        <mesh><sphereGeometry args={[radius * 0.985, 48, 48]} /><meshBasicMaterial color="#050a18" /></mesh>
        <points>
          <bufferGeometry><bufferAttribute attach="attributes-position" args={[pos, 3]} /></bufferGeometry>
          <pointsMaterial size={0.035} color={CYAN} transparent opacity={0.95} sizeAttenuation depthWrite={false} />
        </points>
        {arcLines.map((pts, i) => (
          <Polyline key={i} points={pts} color={i % 2 ? WARM : '#cfe0ff'} opacity={0.85} />
        ))}
      </group>
    </group>
  )
}

// Глава 1: бросок под углом — как стробоскопическая фотография из учебника.
// Полупрозрачные «копии» мяча через равные промежутки времени (наверху ближе —
// там он медленнее), светящийся след, живая стрелка скорости и пол из точек.
const G = 2.2, VX = 1.9, VY = 4.6, X0 = -4.2, Y0 = -2.6 // условные единицы сцены
const FLIGHT_T = (2 * VY) / G
const at = (t: number) => new THREE.Vector3(X0 + VX * t, Y0 + VY * t - (G * t * t) / 2, Math.sin(t * 0.5) * 0.6)

function DotFloor() {
  const pos = useMemo(() => {
    const a: number[] = []
    for (let x = -14; x <= 14; x += 0.55) for (let z = -16; z <= 6; z += 0.55) a.push(x, Y0 - 0.02, z)
    return new Float32Array(a)
  }, [])
  return (
    <points>
      <bufferGeometry><bufferAttribute attach="attributes-position" args={[pos, 3]} /></bufferGeometry>
      <pointsMaterial size={0.035} color="#4f78d6" transparent opacity={0.55} sizeAttenuation depthWrite={false} />
    </points>
  )
}

function Projectile() {
  const ball = useRef<THREE.Group>(null)
  const trail = useRef<THREE.Points>(null)
  const ghosts = useRef<THREE.Group[]>([])
  const TRAIL = 46
  const trailPos = useMemo(() => new Float32Array(TRAIL * 3), [])
  const trailCol = useMemo(() => new Float32Array(TRAIL * 3), [])
  const path = useMemo(() => new THREE.CatmullRomCurve3(Array.from({ length: 60 }, (_, i) => at((FLIGHT_T * i) / 59))), [])
  const tube = useMemo(() => new THREE.TubeGeometry(path, 160, 0.012, 6, false), [path])
  const glowTube = useMemo(() => new THREE.TubeGeometry(path, 160, 0.06, 8, false), [path])
  const strobe = useMemo(() => Array.from({ length: 11 }, (_, i) => at((FLIGHT_T * i) / 10)), [])
  const apex = useMemo(() => at(VY / G), [])
  const arrow = useMemo(() => {
    const a = new THREE.ArrowHelper(new THREE.Vector3(1, 0, 0), new THREE.Vector3(), 1, 0xffffff, 0.28, 0.16)
    ;(a.line.material as THREE.LineBasicMaterial).transparent = true
    ;(a.line.material as THREE.LineBasicMaterial).opacity = 0.9
    return a
  }, [])
  const history = useRef<THREE.Vector3[]>([])
  const dot = useGlowTexture() // круглые светящиеся точки следа вместо квадратов

  useFrame(({ clock }) => {
    const cycle = FLIGHT_T + 1.2 // пауза после приземления
    const t = Math.min((clock.elapsedTime * 0.9) % cycle, FLIGHT_T)
    const p = at(t)
    ball.current?.position.copy(p)
    // стрелка скорости: касательная к траектории, длина ~ скорость
    const v = new THREE.Vector3(VX, VY - G * t, 0.3 * Math.cos(t * 0.5))
    arrow.position.copy(p)
    arrow.setDirection(v.clone().normalize())
    arrow.setLength(0.35 + v.length() * 0.32, 0.26, 0.15)
    // «копии» мяча загораются, когда мяч их проходит
    ghosts.current.forEach((g, i) => {
      if (!g) return
      const ti = (FLIGHT_T * i) / 10
      const m = g.children[0] as THREE.Mesh
      ;(m.material as THREE.MeshBasicMaterial).opacity = t >= ti ? 0.32 : 0.05
    })
    // светящийся след из затухающих точек
    const h = history.current
    if (t < 0.02) h.length = 0
    h.unshift(p)
    if (h.length > TRAIL) h.length = TRAIL
    for (let i = 0; i < TRAIL; i++) {
      const q = h[Math.min(i, h.length - 1)] ?? p
      trailPos.set([q.x, q.y, q.z], i * 3)
      const k = 1 - i / TRAIL
      trailCol.set([1 * k, 0.55 * k, 0.3 * k], i * 3)
    }
    if (trail.current) {
      trail.current.geometry.attributes.position.needsUpdate = true
      trail.current.geometry.attributes.color.needsUpdate = true
    }
  })

  return (
    <group rotation={[0.08, -0.5, 0]} position={[-1.2, 0.3, 0]} scale={0.82}>
      <DotFloor />
      <mesh geometry={glowTube}><meshBasicMaterial color={BLUE} transparent opacity={0.12} blending={THREE.AdditiveBlending} depthWrite={false} /></mesh>
      <mesh geometry={tube}><meshBasicMaterial color="#cfe0ff" transparent opacity={0.75} /></mesh>
      {/* высота подъёма */}
      <Polyline points={[apex, new THREE.Vector3(apex.x, Y0, apex.z)]} color={CYAN} opacity={0.45} dashed />
      <mesh position={apex} rotation={[Math.PI / 2, 0, 0]}><ringGeometry args={[0.36, 0.4, 48]} /><meshBasicMaterial color={CYAN} transparent opacity={0.7} side={THREE.DoubleSide} /></mesh>
      {strobe.map((q, i) => (
        <group key={i} position={q} ref={el => { if (el) ghosts.current[i] = el }}>
          <mesh><sphereGeometry args={[0.2, 24, 24]} /><meshBasicMaterial color="#8fb6ff" transparent opacity={0.05} depthWrite={false} blending={THREE.AdditiveBlending} /></mesh>
        </group>
      ))}
      <points ref={trail}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[trailPos, 3]} />
          <bufferAttribute attach="attributes-color" args={[trailCol, 3]} />
        </bufferGeometry>
        <pointsMaterial map={dot} size={0.34} vertexColors transparent blending={THREE.AdditiveBlending} depthWrite={false} sizeAttenuation />
      </points>
      <group ref={ball}>
        <mesh><sphereGeometry args={[0.26, 32, 32]} /><meshBasicMaterial color={WARM} /></mesh>
        <Glow color={WARM} scale={2.4} opacity={0.85} />
      </group>
      <primitive object={arrow} />
    </group>
  )
}

// Глава 2: маятник
function Pendulum() {
  const arm = useRef<THREE.Group>(null)
  const L = 4.2
  const arc = useMemo(() => {
    const pts: THREE.Vector3[] = []
    for (let i = 0; i <= 40; i++) { const a = -0.55 + (1.1 * i) / 40; pts.push(new THREE.Vector3(Math.sin(a) * L, 2.4 - Math.cos(a) * L, 0)) }
    return pts
  }, [])
  useFrame(({ clock }) => { if (arm.current) arm.current.rotation.z = Math.sin(clock.elapsedTime * 1.5) * 0.55 })
  return (
    <group rotation={[0, -0.3, 0]}>
      <mesh position={[0, 2.4, 0]}><boxGeometry args={[3.4, 0.06, 0.06]} /><meshBasicMaterial color="#5b7fc7" /></mesh>
      <Polyline points={arc} color={CYAN} opacity={0.6} dashed />
      <group ref={arm} position={[0, 2.4, 0]}>
        <mesh position={[0, -L / 2, 0]}><boxGeometry args={[0.025, L, 0.025]} /><meshBasicMaterial color="#cfe0ff" /></mesh>
        <group position={[0, -L, 0]}>
          <mesh><sphereGeometry args={[0.42, 32, 32]} /><meshBasicMaterial color={BLUE} /></mesh>
          <Glow color={BLUE} scale={3.2} opacity={0.9} />
        </group>
      </group>
    </group>
  )
}

// Глава 3: атом — ядро и электроны на орбитах
function Atom() {
  const g = useRef<THREE.Group>(null)
  const electrons = useRef<THREE.Group[]>([])
  const nucleus = useMemo(() => {
    const rand = rng(3)
    return Array.from({ length: 14 }, (_, i) => {
    const u = rand() * 2 - 1, th = rand() * Math.PI * 2, k = Math.sqrt(1 - u * u)
    const v = new THREE.Vector3(k * Math.cos(th), u, k * Math.sin(th)).multiplyScalar(0.32 + rand() * 0.12)
    return { p: v.toArray() as [number, number, number], c: i % 2 ? WARM : BLUE }
    })
  }, [])
  const orbits = [[0, 0, 0], [Math.PI / 3, 0.4, 0], [-Math.PI / 3, -0.4, 0]] as const
  useFrame(({ clock }, dt) => {
    if (g.current) g.current.rotation.y += dt * 0.15
    electrons.current.forEach((e, i) => {
      if (!e) return
      const a = clock.elapsedTime * (1.2 + i * 0.35) + i * 2
      e.position.set(Math.cos(a) * 3, Math.sin(a) * 1.15, 0)
    })
  })
  return (
    <group ref={g}>
      <Glow color={WARM} scale={3} opacity={0.5} />
      {nucleus.map((n, i) => <mesh key={i} position={n.p}><sphereGeometry args={[0.2, 20, 20]} /><meshBasicMaterial color={n.c} /></mesh>)}
      {orbits.map((r, i) => (
        <group key={i} rotation={r as unknown as [number, number, number]}>
          <mesh scale={[1, 0.383, 1]}><torusGeometry args={[3, 0.012, 8, 120]} /><meshBasicMaterial color={CYAN} transparent opacity={0.55} /></mesh>
          <group ref={el => { if (el) electrons.current[i] = el }}>
            <mesh><sphereGeometry args={[0.14, 16, 16]} /><meshBasicMaterial color="#ffffff" /></mesh>
            <Glow color={CYAN} scale={1.4} />
          </group>
        </group>
      ))}
    </group>
  )
}

// Глава 4: Земля и Луна — гравитация
function Gravity() {
  const moon = useRef<THREE.Group>(null)
  const ring = useMemo(() => new THREE.EllipseCurve(0, 0, 5.2, 5.2).getPoints(128).map(p => new THREE.Vector3(p.x, 0, p.y)), [])
  useFrame(({ clock }) => {
    const a = clock.elapsedTime * 0.35
    moon.current?.position.set(Math.cos(a) * 5.2, 0, Math.sin(a) * 5.2)
  })
  return (
    <group rotation={[0.35, 0, -0.15]}>
      <Globe radius={2.2} points={3600} arcs={false} />
      <Polyline points={ring} color={CYAN} opacity={0.35} />
      <group ref={moon}>
        <mesh><sphereGeometry args={[0.5, 32, 32]} /><meshBasicMaterial color="#c9d3e6" /></mesh>
        <Glow color={new THREE.Color('#c9d3e6')} scale={2.2} opacity={0.5} />
      </group>
    </group>
  )
}

// Камера следует за прокруткой; на узком экране сцены по центру, на широком — справа
function Rig() {
  const { camera, size } = useThree()
  const smooth = useRef(0)
  const look = useMemo(() => new THREE.Vector3(), [])
  useFrame((state, dt) => {
    smooth.current += (scroll.s - smooth.current) * Math.min(1, dt * 3.2)
    const s = smooth.current
    const wide = size.width / size.height > 1.05
    // На широком экране сцены справа от текста; на телефоне — над текстом (текст внизу экрана)
    const side = wide ? -4.6 : 0
    const lift = wide ? 0 : -2.6
    const mx = state.pointer.x * 0.6, my = state.pointer.y * 0.4 // лёгкий параллакс от мыши
    camera.position.set(side + mx + Math.sin(s * Math.PI) * 0.8, my + lift, -s * GAP + (wide ? 11 : 16))
    look.set(side + mx * 0.3, lift, -s * GAP)
    camera.lookAt(look)
  })
  return null
}

export default function PhysicsScene() {
  return (
    <Canvas className="lx-canvas" dpr={[1, 2]} camera={{ fov: 50, near: 0.1, far: 220, position: [0, 0, 11] }} gl={{ antialias: true, powerPreference: 'high-performance' }}>
      <color attach="background" args={['#04060c']} />
      <fog attach="fog" args={['#04060c', 18, 60]} />
      <Rig />
      <Stars />
      <group position={[0, 0, 0]}><Globe /></group>
      <group position={[0, 0, -GAP]}><Projectile /></group>
      <group position={[0, 0, -GAP * 2]}><Pendulum /></group>
      <group position={[0, 0, -GAP * 3]}><Atom /></group>
      <group position={[0, 0, -GAP * 4]}><Gravity /></group>
    </Canvas>
  )
}
