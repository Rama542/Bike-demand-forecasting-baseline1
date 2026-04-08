import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../stores/appStore';
import { supabase, isMockAuth } from '../lib/supabase';
import { Bike, Mail, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import BikeRouteAnimation from '../components/auth-map/BikeRouteAnimation';
import ParticleBackground from '../components/ParticleBackground';

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

export default function Login() {
  const [isSignup, setIsSignup] = useState(false);
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw]     = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const login = useAppStore((s) => s.login);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) return;
    setLoading(true);
    setError('');

    try {
      if (isMockAuth) {
        // Mock auth mode
        login(email);
        navigate('/');
      } else {
        // Real Supabase auth
        let result;
        if (isSignup) result = await supabase.auth.signUp({ email, password });
        else          result = await supabase.auth.signInWithPassword({ email, password });

        if (result.error) throw result.error;

        const session = result.data.session;
        if (session) {
          localStorage.setItem('velo_session', JSON.stringify({
            access_token: session.access_token,
            refresh_token: session.refresh_token,
          }));
          login(email, result.data.user?.user_metadata?.name);
          navigate('/');
        } else if (isSignup) {
          setError('Check your email for confirmation link!');
          setLoading(false);
          return;
        }
      }
    } catch (err) {
      setError(err.message || 'Authentication failed');
    }
    setLoading(false);
  };

  return (
    <div className="login-page">
      <ParticleBackground />

      {/* Left Hero */}
      <div className="login-hero">
        <div style={{ position: 'absolute', inset: 0, zIndex: 1, borderRadius: '24px', overflow: 'hidden' }}>
          <BikeRouteAnimation />
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

          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: 4 }}>
            {isSignup ? 'Initialize Account' : 'Authenticate Access'}
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 28, fontFamily: 'var(--font-mono)' }}>
            {isSignup ? 'Start optimizing your fleet today' : 'Sign in to the nexus dashboard'}
          </p>

          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="alert-item warning"
                style={{ marginBottom: 20, fontSize: '0.8rem', background: 'rgba(251,191,36,0.1)' }}
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleSubmit} className="login-form">
            <div className="form-group">
              <label className="form-label">OPERATOR EMAIL</label>
              <div className="input-icon-wrapper">
                <Mail />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="operator@veloai.io"
                  className="input"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">CLEARANCE KEY</label>
              <div className="input-icon-wrapper">
                <Lock />
                <input
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="input"
                  style={{ paddingRight: 40 }}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  style={{
                    position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer',
                  }}
                >
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <motion.button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
              style={{ width: '100%', padding: '14px', fontSize: '0.85rem', marginTop: 8, letterSpacing: '0.1em', fontFamily: 'var(--font-display)' }}
              whileHover={{ scale: 1.02, boxShadow: '0 0 25px rgba(0,245,255,0.4)' }}
              whileTap={{ scale: 0.98 }}
            >
              {loading ? (
                <span className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} />
              ) : (
                <>{isSignup ? 'CREATE PROFILE' : 'INITIATE CONNECTION'} <ArrowRight size={16} /></>
              )}
            </motion.button>
          </form>

          <p style={{ textAlign: 'center', marginTop: 24, fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            {isSignup ? 'Already have access?' : "Don't have an access key?"}{' '}
            <button
              onClick={() => { setIsSignup(!isSignup); setError(''); }}
              style={{ color: 'var(--cyan)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700 }}
            >
              {isSignup ? 'Sign in' : 'Request access'}
            </button>
          </p>

          {isMockAuth && (
            <p style={{ textAlign: 'center', marginTop: 16, fontSize: '0.65rem', color: 'rgba(255,255,255,0.3)', fontFamily: 'var(--font-mono)' }}>
              Demo mode active // bypass credentials
            </p>
          )}
        </motion.div>
      </div>
    </div>
  );
}
