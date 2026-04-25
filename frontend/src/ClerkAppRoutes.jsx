/**
 * ClerkAppRoutes.jsx
 * -----------------
 * This file is ONLY imported when Clerk is active (ClerkProvider is in tree).
 * All useAuth() / Clerk hooks live here so they are NEVER called without a provider.
 */
import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
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

export default function ClerkAppRoutes() {
  return (
    <Suspense fallback={<Loading />}>
      <Routes>
        <Route path="/login"    element={<PublicRoute><Login /></PublicRoute>} />
        <Route path="/sign-up"  element={<PublicRoute><Login isSignUp /></PublicRoute>} />
        <Route path="/"          element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/fleet"     element={<ProtectedRoute><Fleet /></ProtectedRoute>} />
        <Route path="/analytics" element={<ProtectedRoute><Analytics /></ProtectedRoute>} />
        <Route path="/ai"        element={<ProtectedRoute><AIAssistant /></ProtectedRoute>} />
        <Route path="/settings"  element={<ProtectedRoute><Settings /></ProtectedRoute>} />
        <Route path="*"          element={<Navigate to="/login" replace />} />
      </Routes>
    </Suspense>
  );
}
