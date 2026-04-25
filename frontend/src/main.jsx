/**
 * main.jsx — VeloAI App Entry Point
 *
 * Strategy:
 * - On localhost with a Clerk key: full auth via ClerkProvider
 * - On production without pk_live_ key: demo mode, skip Clerk entirely
 *   (Clerk's dev keys don't authenticate on external domains)
 */
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import './index.css';

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY || '';

// A dev key (pk_test_*) only works for auth on localhost.
// On any other domain, Clerk loads but never authenticates → infinite /login loop.
const IS_DEV_KEY = !PUBLISHABLE_KEY || PUBLISHABLE_KEY.startsWith('pk_test_');
const IS_LOCALHOST =
  window.location.hostname === 'localhost' ||
  window.location.hostname === '127.0.0.1' ||
  window.location.hostname.endsWith('.local');

const USE_CLERK = !IS_DEV_KEY || IS_LOCALHOST;

const root = createRoot(document.getElementById('root'));

if (USE_CLERK && PUBLISHABLE_KEY) {
  // ── Clerk mode (localhost + valid key, OR production with pk_live_*) ────────
  console.info('🔐 Running with Clerk authentication.');
  import('@clerk/clerk-react').then(({ ClerkProvider }) => {
    import('./App').then(({ default: App }) => {
      root.render(
        <StrictMode>
          <ClerkProvider
            publishableKey={PUBLISHABLE_KEY}
            signInFallbackRedirectUrl="/"
            signUpFallbackRedirectUrl="/"
            signInUrl="/login"
            signUpUrl="/sign-up"
          >
            <BrowserRouter>
              <App />
            </BrowserRouter>
          </ClerkProvider>
        </StrictMode>
      );
    });
  }).catch((err) => {
    console.error('Clerk failed to load, switching to demo mode:', err);
    startDemoMode(root);
  });
} else {
  // ── Demo mode (production without a live Clerk key) ───────────────────────
  startDemoMode(root);
}

function startDemoMode(root) {
  console.info('ℹ️  Demo mode: auth bypassed (no production Clerk key on this domain).');
  import('./DemoApp').then(({ default: DemoApp }) => {
    root.render(
      <StrictMode>
        <BrowserRouter>
          <DemoApp />
        </BrowserRouter>
      </StrictMode>
    );
  });
}

// PWA Service Worker Registration
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/service-worker.js')
      .then(() => console.log('SW registered ✅'))
      .catch((err) => console.log('SW failed:', err));
  });
}
