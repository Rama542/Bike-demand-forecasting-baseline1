import { lazy, Suspense, useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import MainLayout from './components/layout/MainLayout';
import Login from './pages/Login';

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
        <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.7rem', color: 'var(--cyan)', letterSpacing: '0.3em', opacity: 0.7 }}>
          LOADING
        </span>
      </div>
    </div>
  );
}

// Lazy-loaded Clerk guards — only imported/evaluated when Clerk is available.
// This prevents useAuth() from running without a ClerkProvider in the tree.
const ClerkAppRoutes = lazy(() => import('./ClerkAppRoutes'));

// ── Demo / No-Auth routes (used when Clerk key is unavailable on production) ──
function DemoAppRoutes() {
  return (
    <Routes>
      {/* In demo mode, login/sign-up redirect straight to the dashboard */}
      <Route path="/login"    element={<Navigate to="/" replace />} />
      <Route path="/sign-up"  element={<Navigate to="/" replace />} />
      {/* All protected pages are accessible without auth */}
      <Route path="/"          element={<MainLayout><Dashboard /></MainLayout>} />
      <Route path="/fleet"     element={<MainLayout><Fleet /></MainLayout>} />
      <Route path="/analytics" element={<MainLayout><Analytics /></MainLayout>} />
      <Route path="/ai"        element={<MainLayout><AIAssistant /></MainLayout>} />
      <Route path="/settings"  element={<MainLayout><Settings /></MainLayout>} />
      <Route path="*"          element={<Navigate to="/" replace />} />
    </Routes>
  );
}

// ── App ───────────────────────────────────────────────────────────────────────

export default function App({ clerkFailed = false }) {
  const [introComplete] = useState(true);

  return (
    <AnimatePresence>
      {introComplete && (
        <motion.div
          key="app-content"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          style={{ width: '100%', height: '100%' }}
        >
          <Suspense fallback={<Loading />}>
            {clerkFailed
              ? <DemoAppRoutes />
              : <ClerkAppRoutes />
            }
          </Suspense>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
