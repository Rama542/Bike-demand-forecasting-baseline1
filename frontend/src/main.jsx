import { StrictMode, Component } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './index.css';
import { ClerkProvider } from '@clerk/clerk-react';

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY || "";

// Detect if we're running with a dev Clerk key on a non-local domain.
// Clerk dev keys (pk_test_*) only authenticate users on localhost.
// On production domains they load but can never create sessions,
// causing all protected routes to redirect to /login forever.
const IS_DEV_KEY = !PUBLISHABLE_KEY || PUBLISHABLE_KEY.startsWith('pk_test_');
const IS_LOCALHOST = typeof window !== 'undefined' &&
  (window.location.hostname === 'localhost' ||
   window.location.hostname === '127.0.0.1' ||
   window.location.hostname.endsWith('.local'));

// Auto-bypass Clerk on production when only a dev key is available
const CLERK_BYPASS = IS_DEV_KEY && !IS_LOCALHOST;

// Error boundary to catch Clerk crashes and still render the app
class ClerkErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, info) {
    console.warn('[ClerkErrorBoundary] Clerk failed to initialize:', error.message);
    console.warn('Rendering app without Clerk authentication.');
  }
  render() {
    if (this.state.hasError) {
      return (
        <BrowserRouter>
          <App clerkFailed />
        </BrowserRouter>
      );
    }
    return this.props.children;
  }
}

// If no usable Clerk key, skip ClerkProvider entirely and run in demo mode
if (CLERK_BYPASS || !PUBLISHABLE_KEY) {
  console.info('ℹ️  Running in demo mode (no production Clerk key set). Auth is bypassed.');
  createRoot(document.getElementById('root')).render(
    <StrictMode>
      <BrowserRouter>
        <App clerkFailed />
      </BrowserRouter>
    </StrictMode>
  );
} else {
  createRoot(document.getElementById('root')).render(
    <StrictMode>
      <ClerkErrorBoundary>
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
      </ClerkErrorBoundary>
    </StrictMode>
  );
}

// PWA Service Worker Registration
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/service-worker.js")
      .then(() => console.log("SW registered ✅"))
      .catch((err) => console.log("SW failed:", err));
  });
}
