import React, { useEffect, useState } from 'react';
import { motion, useSpring } from 'framer-motion';

export default function CursorGlow() {
  const [mousePosition, setMousePosition] = useState({ x: -100, y: -100 });
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
      if (!isVisible) setIsVisible(true);
    };

    const handleMouseLeave = () => setIsVisible(false);
    
    window.addEventListener('mousemove', handleMouseMove);
    document.body.addEventListener('mouseleave', handleMouseLeave);
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      document.body.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [isVisible]);

  // Use springs for smooth following effect
  const springConfig = { damping: 40, stiffness: 200, mass: 1 };
  const cursorX = useSpring(mousePosition.x, springConfig);
  const cursorY = useSpring(mousePosition.y, springConfig);

  return (
    <motion.div
      style={{
        position: 'fixed',
        left: 0,
        top: 0,
        x: cursorX,
        y: cursorY,
        width: 600,
        height: 600,
        translateX: '-50%',
        translateY: '-50%',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(0,245,255,0.08) 0%, rgba(123,97,255,0.03) 40%, transparent 70%)',
        pointerEvents: 'none',
        zIndex: 0, // Behind main UI layers, but above background
        opacity: isVisible ? 1 : 0,
        transition: 'opacity 0.5s ease',
      }}
    />
  );
}
