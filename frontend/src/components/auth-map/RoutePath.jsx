import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function RoutePath({ phase, startPos, endPos, controlPos }) {
  const pathD = `M ${startPos.x} ${startPos.y} Q ${controlPos.x} ${controlPos.y} ${endPos.x} ${endPos.y}`;

  return (
    <svg 
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }} 
      viewBox="0 0 100 100" 
      preserveAspectRatio="none"
    >
      <defs>
        <linearGradient id="routeGradient" x1="0" y1="1" x2="1" y2="0">
          <stop offset="0%" stopColor="#00F5FF" />
          <stop offset="100%" stopColor="#7B61FF" />
        </linearGradient>
        <filter id="glow">
          <feGaussianBlur stdDeviation="1.5" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>

      {/* Base dim line connecting points (visible when found or riding) */}
      <AnimatePresence>
        {(phase === 'found' || phase === 'riding' || phase === 'arrived') && (
          <motion.path
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.15 }}
            exit={{ opacity: 0 }}
            d={pathD}
            fill="none"
            stroke="#fff"
            strokeWidth="0.3"
            strokeDasharray="1 2"
          />
        )}
      </AnimatePresence>

      {/* Animated Glowing Route line */}
      <AnimatePresence>
        {(phase === 'riding' || phase === 'arrived') && (
          <motion.path
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 4.5, ease: 'easeInOut' }}
            d={pathD}
            fill="none"
            stroke="url(#routeGradient)"
            strokeWidth="0.8"
            filter="url(#glow)"
          />
        )}
      </AnimatePresence>

      {/* Origin Marker (Pickup) */}
      <motion.circle
        cx={startPos.x}
        cy={startPos.y}
        r={0.8}
        fill="#00F5FF"
        filter="url(#glow)"
      />
      {/* Origin Pulse */}
      <motion.circle
        cx={startPos.x}
        cy={startPos.y}
        fill="none"
        stroke="#00F5FF"
        strokeWidth="0.2"
        initial={{ r: 0.8, opacity: 0.8 }}
        animate={{ r: 4, opacity: 0 }}
        transition={{ duration: 1.5, repeat: Infinity, ease: 'easeOut' }}
      />

      {/* Destination Marker (Drop-off) */}
      <AnimatePresence>
        {(phase === 'found' || phase === 'riding' || phase === 'arrived') && (
          <motion.circle
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            cx={endPos.x}
            cy={endPos.y}
            r={0.8}
            fill="#7B61FF"
            filter="url(#glow)"
          />
        )}
      </AnimatePresence>
      
      {/* Destination Arrived Blast/Ripple */}
      <AnimatePresence>
        {phase === 'arrived' && (
          <motion.circle
            initial={{ r: 0.8, opacity: 1, strokeWidth: 0.6 }}
            animate={{ r: 8, opacity: 0, strokeWidth: 0 }}
            cx={endPos.x}
            cy={endPos.y}
            fill="none"
            stroke="#FF3CAC"
            transition={{ duration: 1.2, ease: 'easeOut' }}
          />
        )}
      </AnimatePresence>
    </svg>
  );
}
