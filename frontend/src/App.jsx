import { lazy, Suspense, useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@clerk/clerk-react';
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

// ── Route guards when Clerk IS available ─────────────────────────────────────

function ProtectedRoute({ children }) {
  const { isLoaded, userId } = useAuth();
  if (!isLoaded) return <Loading />;
  if (!userId) return <Navigate to="/login" replace />;
  return <MainLayout>{children}</MainLayout>;
}

function PublicRoute({ children }) {
  const { isLoaded, userId } = useAuth();
  if (!isLoaded) return <Loading />;
  if (userId) return <Navigate to="/" replace />;
  return children;
}

// ── Route guards when Clerk FAILED (no ClerkProvider in tree) ────────────────
// Never touch useAuth() here — no provider means hook would throw.

function ProtectedRouteNoClerk({ children }) {
  // Clerk is unavailable (dev key on production domain) → allow access freely
  // The app has full mock data fallbacks so it works without auth
  return <MainLayout>{children}</MainLayout>;
}

function PublicRouteNoClerk({ children }) {
  // When Clerk is down, redirect login page straight to dashboard
  return <Navigate to="/" replace />;
}

// ── App ───────────────────────────────────────────────────────────────────────

export default function App({ clerkFailed = false }) {
  const [introComplete] = useState(true);

  // Choose the right guard set based on whether Clerk initialised
  const Protected = clerkFailed ? ProtectedRouteNoClerk : ProtectedRoute;
  const Public    = clerkFailed ? PublicRouteNoClerk    : PublicRoute;

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
            <Routes>
              <Route path="/login"    element={<Public><Login /></Public>} />
              <Route path="/sign-up"  element={<Public><Login isSignUp /></Public>} />
              <Route path="/"          element={<Protected><Dashboard /></Protected>} />
              <Route path="/fleet"     element={<Protected><Fleet /></Protected>} />
              <Route path="/analytics" element={<Protected><Analytics /></Protected>} />
              <Route path="/ai"        element={<Protected><AIAssistant /></Protected>} />
              <Route path="/settings"  element={<Protected><Settings /></Protected>} />
              <Route path="*"          element={<Navigate to="/login" replace />} />
            </Routes>
          </Suspense>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
