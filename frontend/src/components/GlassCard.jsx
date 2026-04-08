import React from 'react';
import { motion } from 'framer-motion';

export default function GlassCard({ children, className = '', style = {}, glowColor = 'cyan', delay = 0, hoverable = true, ...props }) {
  // Select color token base
  const glowHex = glowColor === 'cyan' ? '#00F5FF' : 
                  glowColor === 'violet' ? '#7B61FF' : 
                  glowColor === 'pink' ? '#FF3CAC' : '#00F5FF';

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay, ease: 'easeOut' }}
      whileHover={hoverable ? {
        y: -4,
        scale: 1.01,
        borderColor: `${glowHex}40`, /* 25% opacity */
        boxShadow: `0 16px 40px rgba(0,0,0,0.5), inset 0 0 20px ${glowHex}10, 0 0 20px ${glowHex}20`
      } : {}}
      className={`card ${className}`}
      style={{
        background: 'var(--bg-card)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid var(--border)',
        position: 'relative',
        overflow: 'hidden',
        transition: 'all 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
        ...style
      }}
      {...props}
    >
      {/* Subtle sweep gradient overlaid */}
      <div 
        style={{
          position: 'absolute',
          inset: 0,
          background: `linear-gradient(135deg, ${glowHex}05 0%, transparent 50%, rgba(255,255,255,0.01) 100%)`,
          pointerEvents: 'none'
        }}
      />
      
      {/* Content wrapper */}
      <div style={{ position: 'relative', zIndex: 1, height: '100%' }}>
        {children}
      </div>
    </motion.div>
  );
}
