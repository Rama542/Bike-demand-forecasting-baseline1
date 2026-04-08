import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const BOOT_LINES = [
  '> INITIALIZING VELOAI NEURAL CORE...',
  '> LOADING FLEET MATRIX v4.2.1...',
  '> CONNECTING TO TELEMETRY NODES...',
  '> CALIBRATING DEMAND PREDICTION ENGINE...',
  '> SYNCHRONIZING LIVE DATA STREAMS...',
  '> SYSTEM READY — ENTERING COMMAND CENTER',
];

function BootOrb() {
  const meshRef = useRef();
  const ring1 = useRef();
  const ring2 = useRef();

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    if (meshRef.current) {
      meshRef.current.rotation.y = t * 0.6;
      meshRef.current.material.emissiveIntensity = 0.6 + Math.sin(t * 3) * 0.4;
    }
    if (ring1.current) ring1.current.rotation.z = t * 0.8;
    if (ring2.current) ring2.current.rotation.x = t * 0.5;
  });

  return (
    <group>
      <mesh ref={meshRef}>
        <icosahedronGeometry args={[1.2, 2]} />
        <meshStandardMaterial
          color="#00F5FF"
          emissive="#00F5FF"
          emissiveIntensity={0.8}
          wireframe
          transparent
          opacity={0.8}
        />
      </mesh>
      <mesh ref={ring1}>
        <torusGeometry args={[2, 0.03, 16, 100]} />
        <meshBasicMaterial color="#00F5FF" transparent opacity={0.5} />
      </mesh>
      <mesh ref={ring2}>
        <torusGeometry args={[2.6, 0.015, 16, 100]} />
        <meshBasicMaterial color="#8B5CF6" transparent opacity={0.35} />
      </mesh>
      <pointLight color="#00F5FF" intensity={3} distance={8} />
    </group>
  );
}

export default function IntroSequence({ onComplete }) {
  const [visibleLines, setVisibleLines] = useState([]);
  const [progress, setProgress] = useState(0);
  const [done, setDone] = useState(false);
  const skipRef = useRef(false);

  // Already shown this session?
  const alreadyShown = typeof sessionStorage !== 'undefined' && sessionStorage.getItem('velo_intro_done');

  useEffect(() => {
    if (alreadyShown) { onComplete?.(); return; }

    let lineIdx = 0;
    const lineInterval = setInterval(() => {
      if (skipRef.current) { clearInterval(lineInterval); return; }
      setVisibleLines((prev) => [...prev, BOOT_LINES[lineIdx]]);
      setProgress(Math.round(((lineIdx + 1) / BOOT_LINES.length) * 100));
      lineIdx++;
      if (lineIdx >= BOOT_LINES.length) {
        clearInterval(lineInterval);
        setTimeout(() => {
          if (!skipRef.current) finish();
        }, 600);
      }
    }, 330);

    return () => clearInterval(lineInterval);
  }, []);

  const finish = () => {
    sessionStorage.setItem('velo_intro_done', '1');
    setDone(true);
    setTimeout(() => onComplete?.(), 700);
  };

  const handleSkip = () => {
    skipRef.current = true;
    finish();
  };

  if (alreadyShown) return null;

  return (
    <AnimatePresence>
      {!done && (
        <motion.div
          key="intro"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.04, filter: 'blur(20px)' }}
          transition={{ duration: 0.7, ease: 'easeInOut' }}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 99999,
            background: '#030305',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
          }}
        >
          {/* Background gradient orbs */}
          <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
            <div style={{ position: 'absolute', top: '10%', left: '15%', width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,245,255,0.08), transparent 70%)', filter: 'blur(40px)' }} />
            <div style={{ position: 'absolute', bottom: '10%', right: '15%', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(139,92,246,0.07), transparent 70%)', filter: 'blur(50px)' }} />
          </div>

          {/* 3D Orb */}
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            style={{ marginBottom: 32 }}
          >
            <div style={{ width: 200, height: 200 }}>
              <Canvas camera={{ position: [0, 0, 5], fov: 45 }} style={{ background: 'transparent' }} gl={{ alpha: true }}>
                <ambientLight intensity={0.1} />
                <BootOrb />
              </Canvas>
            </div>
          </motion.div>

          {/* Brand */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            style={{ textAlign: 'center', marginBottom: 36 }}
          >
            <div style={{
              fontSize: '3rem',
              fontWeight: 900,
              fontFamily: "'Orbitron', 'JetBrains Mono', monospace",
              background: 'linear-gradient(135deg, #00F5FF 0%, #8B5CF6 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              letterSpacing: '0.15em',
              textShadow: 'none',
            }}>
              VELO<span style={{ opacity: 0.8 }}>AI</span>
            </div>
            <div style={{ fontSize: '0.7rem', fontFamily: 'JetBrains Mono, monospace', color: 'rgba(0,245,255,0.5)', letterSpacing: '0.4em', marginTop: 4, textTransform: 'uppercase' }}>
              Fleet Intelligence Platform
            </div>
          </motion.div>

          {/* Boot terminal */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            style={{
              width: '100%',
              maxWidth: 520,
              background: 'rgba(0,245,255,0.04)',
              border: '1px solid rgba(0,245,255,0.15)',
              borderRadius: 12,
              padding: '20px 24px',
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: '0.72rem',
              color: 'rgba(0,245,255,0.75)',
              minHeight: 150,
            }}
          >
            {visibleLines.map((line, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.25 }}
                style={{ marginBottom: 6, lineHeight: 1.6 }}
              >
                {line}
              </motion.div>
            ))}
            <span style={{ opacity: 0.5, animation: 'pulse 1s ease-in-out infinite' }}>█</span>
          </motion.div>

          {/* Progress bar */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            style={{ width: '100%', maxWidth: 520, marginTop: 20 }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.65rem', color: 'rgba(0,245,255,0.4)' }}>SYSTEM BOOT</span>
              <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.65rem', color: '#00F5FF' }}>{progress}%</span>
            </div>
            <div style={{ height: 3, background: 'rgba(0,245,255,0.1)', borderRadius: 2, overflow: 'hidden' }}>
              <motion.div
                style={{ height: '100%', background: 'linear-gradient(90deg, #00F5FF, #8B5CF6)', borderRadius: 2, boxShadow: '0 0 8px #00F5FF' }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
              />
            </div>
          </motion.div>

          {/* Skip button */}
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            onClick={handleSkip}
            style={{
              marginTop: 28,
              background: 'none',
              border: '1px solid rgba(0,245,255,0.2)',
              color: 'rgba(0,245,255,0.5)',
              padding: '6px 20px',
              borderRadius: 6,
              cursor: 'pointer',
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: '0.65rem',
              letterSpacing: '0.2em',
              transition: 'all 0.2s ease',
            }}
            whileHover={{ borderColor: 'rgba(0,245,255,0.6)', color: '#00F5FF' }}
          >
            SKIP INTRO
          </motion.button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
