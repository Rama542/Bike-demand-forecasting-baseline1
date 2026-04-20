import { lazy, Suspense, useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@clerk/clerk-react';
import MainLayout from './components/layout/MainLayout';
import Login from './pages/Login';
import IntroSequence from './components/IntroSequence';

const Dashboard   = lazy(() => import('./pages/Dashboard'));
const Fleet       = lazy(() => import('./pages/Fleet'));
const Analytics   = lazy(() => import('./pages/Analytics'));
const AIAssistant = lazy(() => import('./pages/AIAssistant'));
const Settings    = lazy(() => import('./pages/Settings'));

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

export default function App() {
  // Bypass intro sequence to fix WebGL infinite loading crashes
  const [introComplete, setIntroComplete] = useState(true);

  return (
    <>
      {/* Intro sequence bypassed */}

      {/* Main app — fades in after intro completes */}
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
                <Route
                  path="/login"
                  element={<PublicRoute><Login /></PublicRoute>}
                />
                <Route
                  path="/sign-up"
                  element={<PublicRoute><Login isSignUp /></PublicRoute>}
                />
                <Route path="/"          element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                <Route path="/fleet"     element={<ProtectedRoute><Fleet /></ProtectedRoute>} />
                <Route path="/analytics" element={<ProtectedRoute><Analytics /></ProtectedRoute>} />
                <Route path="/ai"        element={<ProtectedRoute><AIAssistant /></ProtectedRoute>} />
                <Route path="/settings"  element={<ProtectedRoute><Settings /></ProtectedRoute>} />
                <Route path="*"          element={<Navigate to="/" replace />} />
              </Routes>
            </Suspense>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
