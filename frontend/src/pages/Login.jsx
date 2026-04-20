import { useState, useEffect, lazy, Suspense } from 'react';
import { SignIn, SignUp } from '@clerk/clerk-react';
import { Bike } from 'lucide-react';
import { motion } from 'framer-motion';
import ParticleBackground from '../components/ParticleBackground';

// Lazy-load the heavy map animation so it never blocks the auth form
const BikeRouteAnimation = lazy(() => import('../components/auth-map/BikeRouteAnimation'));

// Fallback dark map shown instantly while tiles load
function MapFallback() {
  return (
    <div style={{
      width: '100%', height: '100%',
      background: 'radial-gradient(ellipse at 30% 60%, rgba(0,245,255,0.08) 0%, #0A0F1C 70%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{
        width: 60, height: 60, border: '2px solid rgba(0,245,255,0.3)',
        borderTop: '2px solid #00F5FF', borderRadius: '50%',
        animation: 'spin 1s linear infinite',
      }} />
    </div>
  );
}

// Simple counter animation component
function Counter({ value, label }) {
  const [count, setCount] = useState(0);
  const target = parseFloat(value) || 0;
  const suffix = value.replace(/[0-9.]/g, '');

  useEffect(() => {
    let current = 0;
    const duration = 1500;
    const stepTime = 20;
    const steps = duration / stepTime;
    const increment = target / steps;

    const timer = setInterval(() => {
      current += increment;
      if (current >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(current);
      }
    }, stepTime);
    return () => clearInterval(timer);
  }, [target]);

  const displayValue = target % 1 === 0 ? Math.floor(count) : count.toFixed(1);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <p style={{
        fontSize: '1.2rem',
        fontWeight: 800,
        color: 'var(--cyan)',
        fontFamily: 'var(--font-mono)',
        textShadow: '0 0 10px rgba(0,245,255,0.4)'
      }}>
        {target === 0 ? value : `${displayValue}${suffix}`}
      </p>
      <p style={{ fontSize: '0.65rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        {label}
      </p>
    </motion.div>
  );
}

export default function Login({ isSignUp = false }) {

  return (
    <div className="login-page">
      <ParticleBackground />

      {/* Left Hero */}
      <div className="login-hero">
        <div style={{ position: 'absolute', inset: 0, zIndex: 1, borderRadius: '24px', overflow: 'hidden' }}>
          <Suspense fallback={<MapFallback />}>
            <BikeRouteAnimation />
          </Suspense>
        </div>
        <div className="login-hero-bg" />
        <motion.div
          className="login-hero-content"
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28 }}>
            <div className="sidebar-logo" style={{ width: 44, height: 44 }}>
              <Bike size={24} />
            </div>
            <div>
              <h1 className="glitch-text" style={{
                fontSize: '1.8rem',
                fontFamily: 'var(--font-display)',
                letterSpacing: '0.1em',
                background: 'linear-gradient(135deg, #00F5FF 0%, #8B5CF6 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}>
                VELOAI
              </h1>
              <p style={{ fontSize: '0.65rem', fontFamily: 'var(--font-mono)', color: 'rgba(0,245,255,0.5)', letterSpacing: '0.25em' }}>
                FLEET PLATFORM v4
              </p>
            </div>
          </div>

          <h2 style={{ fontSize: '2.4rem', fontWeight: 900, marginBottom: 16, maxWidth: 480, lineHeight: 1.1, letterSpacing: '-0.02em' }}>
            Intelligent Bike Fleet{' '}
            <span style={{ color: 'var(--cyan)', textShadow: '0 0 20px rgba(0,245,255,0.4)' }}>Optimization</span>
          </h2>
          <p style={{ color: 'var(--text-secondary)', maxWidth: 420, fontSize: '0.9rem', lineHeight: 1.6, marginBottom: 40 }}>
            Real-time tracking, AI-powered demand prediction, smart rebalancing,
            and dynamic pricing — all in one command center.
          </p>

          <div style={{ display: 'flex', gap: 32 }}>
            <Counter value="8" label="Stations" />
            <Counter value="120+" label="Bikes" />
            <Counter value="ARIMA" label="ML Model" />
            <Counter value="99.9%" label="Uptime" />
          </div>
        </motion.div>
      </div>

      {/* Right Form */}
      <div className="login-form-area">
        <motion.div
          className="login-form-container"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          {/* Mobile view branding */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 32 }} className="login-mobile-brand">
            <Bike size={28} style={{ color: 'var(--cyan)' }} />
            <span style={{ fontSize: '1.4rem', fontWeight: 800, fontFamily: 'var(--font-display)', color: 'var(--cyan)' }}>VELOAI</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', marginTop: 32, width: '100%' }}>
              {isSignUp ? (
                <SignUp
                  fallbackRedirectUrl="/"
                  signInFallbackRedirectUrl="/"
                  signInUrl="/login"
                  appearance={{
                    variables: {
                      colorPrimary: '#00F5FF',
                      colorBackground: 'rgba(8,12,24,0.1)',
                      colorText: '#ffffff',
                      colorTextSecondary: 'rgba(255,255,255,0.6)',
                      colorInputBackground: 'rgba(255,255,255,0.05)',
                      colorInputBorder: 'rgba(0,245,255,0.2)',
                      fontFamily: 'var(--font-mono)'
                    },
                    elements: {
                      card: { boxShadow: 'none', background: 'transparent' },
                      headerTitle: { fontFamily: 'var(--font-display)', letterSpacing: '0.1em' },
                      socialButtonsBlockButton: { border: '1px solid rgba(255,255,255,0.1)' }
                    }
                  }}
                />
              ) : (
                <SignIn
                  fallbackRedirectUrl="/"
                  signUpFallbackRedirectUrl="/"
                  signUpUrl="/sign-up"
                  appearance={{
                    variables: {
                      colorPrimary: '#00F5FF',
                      colorBackground: 'rgba(8,12,24,0.1)',
                      colorText: '#ffffff',
                      colorTextSecondary: 'rgba(255,255,255,0.6)',
                      colorInputBackground: 'rgba(255,255,255,0.05)',
                      colorInputBorder: 'rgba(0,245,255,0.2)',
                      fontFamily: 'var(--font-mono)'
                    },
                    elements: {
                      card: { boxShadow: 'none', background: 'transparent' },
                      headerTitle: { fontFamily: 'var(--font-display)', letterSpacing: '0.1em' },
                      socialButtonsBlockButton: { border: '1px solid rgba(255,255,255,0.1)' }
                    }
                  }}
                />
              )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
