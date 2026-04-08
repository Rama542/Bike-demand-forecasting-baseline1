import { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

function OrbMesh({ isTyping }) {
  const meshRef = useRef();
  const ring1Ref = useRef();
  const ring2Ref = useRef();
  const ring3Ref = useRef();

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    if (meshRef.current) {
      meshRef.current.rotation.y = t * 0.4;
      meshRef.current.rotation.x = Math.sin(t * 0.3) * 0.2;
      const pulse = Math.sin(t * 2) * 0.05 + 1;
      meshRef.current.scale.setScalar(pulse);
      meshRef.current.material.emissiveIntensity = 0.5 + Math.sin(t * 1.5) * 0.3;
    }
    if (ring1Ref.current) {
      ring1Ref.current.rotation.z = t * 0.6;
      ring1Ref.current.rotation.x = Math.sin(t * 0.4) * 0.5;
    }
    if (ring2Ref.current) {
      ring2Ref.current.rotation.z = -t * 0.4;
      ring2Ref.current.rotation.y = t * 0.3;
    }
    if (ring3Ref.current) {
      ring3Ref.current.rotation.x = t * 0.5;
      const s = 1 + Math.sin(t * 1.2) * 0.08;
      ring3Ref.current.scale.setScalar(s);
    }
  });

  const orbColor = isTyping ? '#8B5CF6' : '#00F5FF';
  const emissColor = isTyping ? '#8B5CF6' : '#00F5FF';

  return (
    <group>
      {/* Core orb */}
      <mesh ref={meshRef}>
        <sphereGeometry args={[0.7, 32, 32]} />
        <meshStandardMaterial
          color={orbColor}
          emissive={emissColor}
          emissiveIntensity={0.8}
          transparent
          opacity={0.9}
          roughness={0.1}
          metalness={0.3}
        />
      </mesh>

      {/* Ring 1 */}
      <mesh ref={ring1Ref}>
        <torusGeometry args={[1.2, 0.025, 16, 100]} />
        <meshBasicMaterial color="#00F5FF" transparent opacity={0.6} />
      </mesh>

      {/* Ring 2 */}
      <mesh ref={ring2Ref}>
        <torusGeometry args={[1.6, 0.015, 16, 100]} />
        <meshBasicMaterial color="#8B5CF6" transparent opacity={0.4} />
      </mesh>

      {/* Ring 3 — outer pulsing */}
      <mesh ref={ring3Ref}>
        <torusGeometry args={[1.9, 0.008, 16, 100]} />
        <meshBasicMaterial color="#00F5FF" transparent opacity={0.2} />
      </mesh>

      {/* Lights */}
      <pointLight color="#00F5FF" intensity={2} distance={6} />
      <pointLight color="#8B5CF6" intensity={1} distance={4} position={[2, 1, 1]} />
    </group>
  );
}

export default function GlowOrb({ isTyping = false, size = 180 }) {
  return (
    <div style={{ width: size, height: size, position: 'relative' }}>
      <Canvas camera={{ position: [0, 0, 4], fov: 45 }} style={{ background: 'transparent' }} gl={{ alpha: true }}>
        <ambientLight intensity={0.1} />
        <OrbMesh isTyping={isTyping} />
      </Canvas>
    </div>
  );
}
