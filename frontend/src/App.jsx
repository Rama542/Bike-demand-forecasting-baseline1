/**
 * App.jsx — VeloAI with Clerk Authentication
 * --------------------------------------------
 * This file is ONLY loaded when Clerk is active (ClerkProvider is in the tree).
 * All Clerk hooks are safely inside ClerkAppRoutes (lazy-loaded).
 */
import { lazy, Suspense } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

// All Clerk hook usage is isolated inside ClerkAppRoutes
const ClerkAppRoutes = lazy(() => import('./ClerkAppRoutes'));

function Loading() {
  return (
    <div className="loading-overlay">
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
        <div className="spinner" />
        <span style={{
          fontFamily: 'var(--font-display)',
          fontSize: '0.7rem',
          color: 'var(--cyan)',
          letterSpacing: '0.3em',
          opacity: 0.7,
        }}>
          LOADING
        </span>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AnimatePresence>
      <motion.div
        key="clerk-app"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        style={{ width: '100%', height: '100%' }}
      >
        <Suspense fallback={<Loading />}>
          <ClerkAppRoutes />
        </Suspense>
      </motion.div>
    </AnimatePresence>
  );
}
