import { StrictMode, Component } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './index.css';
import { ClerkProvider } from '@clerk/clerk-react';

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY || "pk_test_cmFyZS1kZWVyLTUzLmNsZXJrLmFjY291bnRzLmRldiQ";

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
      // Render app wrapped in a mock auth context so it still works
      return (
        <BrowserRouter>
          <App clerkFailed />
        </BrowserRouter>
      );
    }
    return this.props.children;
  }
}

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

// PWA Service Worker Registration
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/service-worker.js")
      .then(() => console.log("SW registered ✅"))
      .catch((err) => console.log("SW failed:", err));
  });
}
