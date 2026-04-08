import React, { useRef, useMemo, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

// Constants for the globe
const GLOBE_RADIUS = 3;
const NUM_POINTS = 3000;
const NEON_CYAN = '#00F5FF';
const NEON_PINK = '#FF3CAC';
const ELECTRIC_PURPLE = '#7B61FF';

// Generates points roughly distributed on a sphere
const generatePoints = () => {
  const points = [];
  const phi = Math.PI * (3 - Math.sqrt(5)); // golden angle
  for (let i = 0; i < NUM_POINTS; i++) {
    const y = 1 - (i / (NUM_POINTS - 1)) * 2; // y goes from 1 to -1
    const radiusAtY = Math.sqrt(1 - y * y); // radius at y
    const theta = phi * i; // golden angle increment

    const x = Math.cos(theta) * radiusAtY;
    const z = Math.sin(theta) * radiusAtY;

    // Remove points completely randomly to create a damaged/cyber feel
    if (Math.random() > 0.15) {
      points.push(new THREE.Vector3(x * GLOBE_RADIUS, y * GLOBE_RADIUS, z * GLOBE_RADIUS));
    }
  }
  return points;
};

// Returns random points on the globe for cities
const getRandomCity = (points) => {
  return points[Math.floor(Math.random() * points.length)];
};

const ConnectingArc = ({ start, end, color }) => {
  const lineRef = useRef();

  const curve = useMemo(() => {
    // Generate a smooth bezier curve that arcs outwards from the globe surface
    const mid = start.clone().lerp(end, 0.5);
    const distance = start.distanceTo(end);
    // Push the midpoint outwards along its normal vector relative to center
    mid.normalize().multiplyScalar(GLOBE_RADIUS + distance * 0.4);
    return new THREE.QuadraticBezierCurve3(start, mid, end);
  }, [start, end]);

  useFrame(({ clock }) => {
    if (lineRef.current?.material?.map) {
      lineRef.current.material.map.offset.x -= 0.01;
    }
    // Fade in and out slowly
    if (lineRef.current) {
      lineRef.current.material.opacity = 0.3 + 0.3 * Math.sin(clock.elapsedTime * 2 + start.x);
    }
  });

  return (
    <mesh ref={lineRef}>
      <tubeGeometry args={[curve, 40, 0.025, 8, false]} />
      <meshBasicMaterial color={color} transparent opacity={0.6} depthWrite={false} blending={THREE.AdditiveBlending} />
    </mesh>
  );
};

const MovingBikeIcon = ({ start, end, color }) => {
  const meshRef = useRef();
  
  const curve = useMemo(() => {
    const mid = start.clone().lerp(end, 0.5);
    const distance = start.distanceTo(end);
    mid.normalize().multiplyScalar(GLOBE_RADIUS + distance * 0.4);
    return new THREE.QuadraticBezierCurve3(start, mid, end);
  }, [start, end]);

  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    const t = (clock.elapsedTime * 0.2 + start.x * 10) % 1; // 0 to 1 looping along the curve
    const point = curve.getPoint(t);
    meshRef.current.position.copy(point);
    
    // Pulse scale
    const scale = 1 + Math.sin(clock.elapsedTime * 10) * 0.3;
    meshRef.current.scale.set(scale, scale, scale);
  });

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[0.08, 16, 16]} />
      <meshBasicMaterial color={color} transparent opacity={0.9} />
      <pointLight color={color} intensity={1} distance={2} />
    </mesh>
  );
};

function CyberGlobe({ points }) {
  const groupRef = useRef();

  // Create Float32Array for buffer geometry
  const positions = useMemo(() => {
    const pos = new Float32Array(points.length * 3);
    for (let i = 0; i < points.length; i++) {
        pos[i * 3] = points[i].x;
        pos[i * 3 + 1] = points[i].y;
        pos[i * 3 + 2] = points[i].z;
    }
    return pos;
  }, [points]);

  // Rotate entire globe
  useFrame(({ clock }) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = clock.elapsedTime * 0.08;
      groupRef.current.rotation.x = clock.elapsedTime * 0.02;
    }
  });

  return (
    <group ref={groupRef}>
      {/* The dot cloud */}
      <points>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" count={positions.length / 3} array={positions} itemSize={3} />
        </bufferGeometry>
        <pointsMaterial size={0.03} color={NEON_CYAN} transparent opacity={0.6} sizeAttenuation={true} blending={THREE.AdditiveBlending} />
      </points>

      {/* Core glow */}
      <mesh>
        <sphereGeometry args={[GLOBE_RADIUS * 0.98, 32, 32]} />
        <meshBasicMaterial color="#0A0F1C" />
      </mesh>
      
      {/* Outer subtle halo */}
      <mesh>
        <sphereGeometry args={[GLOBE_RADIUS * 1.15, 32, 32]} />
        <meshBasicMaterial color={ELECTRIC_PURPLE} transparent opacity={0.05} side={THREE.BackSide} blending={THREE.AdditiveBlending} />
      </mesh>
    </group>
  );
}

export default function AuthGlobe() {
  const points = useMemo(() => generatePoints(), []);
  
  // Generate random connecting paths
  const paths = useMemo(() => {
    const routes = [];
    for (let i = 0; i < 8; i++) {
      const p1 = getRandomCity(points);
      const p2 = getRandomCity(points);
      const c = Math.random() > 0.5 ? NEON_PINK : ELECTRIC_PURPLE;
      routes.push({ start: p1, end: p2, color: c });
    }
    return routes;
  }, [points]);

  return (
    <group position={[2.5, 0, -1]}>
      <CyberGlobe points={points} />
      {paths.map((rte, idx) => (
        <group key={idx}>
          <ConnectingArc start={rte.start} end={rte.end} color={rte.color} />
          <MovingBikeIcon start={rte.start} end={rte.end} color="#FFF" />
          
          {/* Nodes at start/end */}
          <mesh position={rte.start}>
            <sphereGeometry args={[0.06, 16, 16]} />
            <meshBasicMaterial color={rte.color} />
          </mesh>
          <mesh position={rte.end}>
            <sphereGeometry args={[0.06, 16, 16]} />
            <meshBasicMaterial color={rte.color} />
          </mesh>
        </group>
      ))}
    </group>
  );
}
