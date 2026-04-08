import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Search, Bike, CheckCircle2 } from 'lucide-react';

import AnimatedMap from './AnimatedMap';
import RoutePath from './RoutePath';
import BikeMarker from './BikeMarker';

// Abstract screen percentages for the animation path
const START_POS = { x: 25, y: 70 };
const END_POS   = { x: 75, y: 30 };
const CONTROL_POS = { x: 35, y: 25 }; 

export default function BikeRouteAnimation() {
  const [phase, setPhase] = useState('searching');
  // Phases: 'searching' -> 'found' -> 'riding' -> 'arrived'

  useEffect(() => {
    let timer;
    if (phase === 'searching') {
      timer = setTimeout(() => setPhase('found'), 2500);
    } else if (phase === 'found') {
      timer = setTimeout(() => setPhase('riding'), 2000);
    } else if (phase === 'riding') {
      timer = setTimeout(() => setPhase('arrived'), 4500); // Ride duration
    } else if (phase === 'arrived') {
      timer = setTimeout(() => setPhase('searching'), 3500); // Reset after 3.5s
    }
    return () => clearTimeout(timer);
  }, [phase]);

  const renderStatusCard = () => {
    let icon, text, color;
    switch (phase) {
      case 'searching':
        icon = <Search size={18} className="animate-pulse" />;
        text = 'Locating nearest optimal bike...';
        color = '#00F5FF'; // Cyan
        break;
      case 'found':
        icon = <Bike size={18} />;
        text = 'Vehicle secured. Computing route...';
        color = '#34d399'; // Green
        break;
      case 'riding':
        icon = <MapPin size={18} />;
        text = 'Ride in progress. ETA 12 mins.';
        color = '#7B61FF'; // Purple
        break;
      case 'arrived':
        icon = <CheckCircle2 size={18} />;
        text = 'Destination reached. Ride completed.';
        color = '#FF3CAC'; // Pink
        break;
      default: return null;
    }

    return (
      <motion.div
        key={phase}
        initial={{ opacity: 0, y: -20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -10, scale: 0.95 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        style={{
          position: 'absolute',
          top: 50,
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'rgba(10, 15, 28, 0.75)',
          backdropFilter: 'blur(24px)',
          border: `1px solid ${color}40`,
          boxShadow: `0 10px 40px rgba(0,0,0,0.6), 0 0 25px ${color}20`,
          borderRadius: 30,
          padding: '14px 28px',
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          color: '#fff',
          fontFamily: 'var(--font-mono, monospace)',
          fontSize: '0.9rem',
          fontWeight: 600,
          zIndex: 1000
        }}
      >
        <div style={{ color }}>{icon}</div>
        <div style={{ letterSpacing: '0.05em' }}>{text}</div>
      </motion.div>
    );
  };

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden', background: '#0A0F1C' }}>
      <AnimatedMap>
        <RoutePath phase={phase} startPos={START_POS} endPos={END_POS} controlPos={CONTROL_POS} />
        <BikeMarker phase={phase} startPos={START_POS} endPos={END_POS} />
      </AnimatedMap>

      {/* Floating UI Top Card Overlay */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 10, pointerEvents: 'none' }}>
        <AnimatePresence mode="wait">
          {renderStatusCard()}
        </AnimatePresence>
      </div>
    </div>
  );
}
