/**
 * DemoApp.jsx — VeloAI Demo Mode
 * --------------------------------
 * This file has ZERO imports from @clerk/clerk-react.
 * It is only loaded when Clerk is unavailable on the host domain.
 * All pages are accessible without authentication.
 */
import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import MainLayout from './components/layout/MainLayout';

const Dashboard   = lazy(() => import('./pages/Dashboard'));
const Fleet       = lazy(() => import('./pages/Fleet'));
const Analytics   = lazy(() => import('./pages/Analytics'));
const AIAssistant = lazy(() => import('./pages/AIAssistant'));
const Settings    = lazy(() => import('./pages/Settings'));

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

export default function DemoApp() {
  return (
    <AnimatePresence>
      <motion.div
        key="demo-app"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        style={{ width: '100%', height: '100%' }}
      >
        <Suspense fallback={<Loading />}>
          <Routes>
            {/* In demo mode, all routes go straight to the dashboard */}
            <Route path="/"          element={<MainLayout><Dashboard /></MainLayout>} />
            <Route path="/fleet"     element={<MainLayout><Fleet /></MainLayout>} />
            <Route path="/analytics" element={<MainLayout><Analytics /></MainLayout>} />
            <Route path="/ai"        element={<MainLayout><AIAssistant /></MainLayout>} />
            <Route path="/settings"  element={<MainLayout><Settings /></MainLayout>} />
            {/* Any login/sign-up routes redirect to dashboard */}
            <Route path="/login"     element={<Navigate to="/" replace />} />
            <Route path="/sign-up"   element={<Navigate to="/" replace />} />
            <Route path="*"          element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </motion.div>
    </AnimatePresence>
  );
}
