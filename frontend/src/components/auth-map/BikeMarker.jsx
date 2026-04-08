import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bike } from 'lucide-react';

export default function BikeMarker({ phase, startPos, endPos }) {
  return (
    <AnimatePresence>
      {phase === 'riding' && (
        <motion.div
          initial={{ left: `${startPos.x}%`, top: `${startPos.y}%`, opacity: 0 }}
          animate={{ left: `${endPos.x}%`, top: `${endPos.y}%`, opacity: 1, rotate: [0, 5, -5, 0] }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={{ 
            left: { duration: 4.5, ease: 'easeInOut' }, 
            top: { duration: 4.5, ease: 'easeInOut' }, 
            opacity: { duration: 0.5 },
            rotate: { duration: 0.8, repeat: Infinity, ease: 'easeInOut' }
          }}
          style={{
            position: 'absolute',
            zIndex: 6,
            transform: 'translate(-50%, -50%)',
            width: 36,
            height: 36,
            background: 'rgba(10, 15, 28, 0.9)',
            backdropFilter: 'blur(8px)',
            border: '2px solid #00F5FF',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 20px rgba(0,245,255,0.6)'
          }}
        >
          <Bike size={18} color="#00F5FF" />
          
          {/* Motion blur/trail simulation via a shadow element */}
          <div style={{
            position: 'absolute',
            inset: -4,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(0,245,255,0.4) 0%, transparent 70%)',
            zIndex: -1,
            pointerEvents: 'none',
          }} />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
