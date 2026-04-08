import { useRef, useState } from 'react';
import { motion } from 'framer-motion';

/**
 * HologramCard — Glassmorphism card with 3D mouse-tilt + neon glow border.
 * Usage: <HologramCard className="..." style={...}>{children}</HologramCard>
 */
export default function HologramCard({ children, className = '', style = {}, glowColor = '#00F5FF', onClick }) {
  const ref = useRef(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [hovered, setHovered] = useState(false);

  const handleMouseMove = (e) => {
    const rect = ref.current.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = (e.clientX - cx) / (rect.width / 2);
    const dy = (e.clientY - cy) / (rect.height / 2);
    setTilt({ x: dy * -8, y: dx * 8 });
  };

  const handleMouseLeave = () => {
    setTilt({ x: 0, y: 0 });
    setHovered(false);
  };

  return (
    <motion.div
      ref={ref}
      className={`hologram-card ${className}`}
      style={{
        ...style,
        transform: `perspective(800px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
        transition: hovered ? 'transform 0.1s ease, box-shadow 0.3s ease, border-color 0.3s ease' : 'transform 0.5s ease, box-shadow 0.3s ease, border-color 0.3s ease',
        '--glow-color': glowColor,
      }}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      whileTap={onClick ? { scale: 0.98 } : {}}
    >
      {/* Inner shimmer sweep */}
      {hovered && (
        <div className="hologram-shimmer" aria-hidden="true" />
      )}
      {children}
    </motion.div>
  );
}
