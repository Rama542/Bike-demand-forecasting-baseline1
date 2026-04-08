import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Sphere, MeshDistortMaterial } from '@react-three/drei';

function Orb({ isSpeaking }) {
  const mesh = useRef();
  
  useFrame((state) => {
    if (mesh.current) {
      mesh.current.rotation.x = state.clock.elapsedTime * 0.2;
      mesh.current.rotation.y = state.clock.elapsedTime * 0.3;
    }
  });

  return (
    <Sphere ref={mesh} args={[1, 64, 64]} scale={isSpeaking ? 1.1 : 0.8}>
      <MeshDistortMaterial 
        color="#00f5ff" 
        attach="material" 
        distort={isSpeaking ? 0.6 : 0.3} 
        speed={isSpeaking ? 5 : 2} 
        roughness={0.2}
        metalness={0.8}
        emissive="#00f5ff"
        emissiveIntensity={0.6}
        clearcoat={1}
      />
    </Sphere>
  );
}

export default function FloatingOrb({ isSpeaking = false }) {
  return (
    <div style={{ width: '200px', height: '200px', margin: '0 auto' }}>
      <Canvas camera={{ position: [0, 0, 3] }}>
        <ambientLight intensity={0.2} color="#8b5cf6" />
        <directionalLight position={[10, 10, 5]} intensity={1.5} color="#00f5ff" />
        <Orb isSpeaking={isSpeaking} />
      </Canvas>
    </div>
  );
}
