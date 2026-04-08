import { useState, useRef, useEffect, lazy, Suspense } from 'react';
import { useAppStore } from '../stores/appStore';
import { sendChatMessage } from '../lib/api';
import { Send, User, Sparkles, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const GlowOrb = lazy(() => import('../components/GlowOrb'));

const SUGGESTIONS = [
  "Where should I move bikes?",
  "What's the pricing recommendation?",
  "Which stations are busiest?",
  "How does weather affect demand?",
  "What's the demand forecast?",
  "How much revenue are we generating?",
];

function VoiceWave() {
  return (
    <div className="voice-wave">
      {[1, 2, 3, 4, 5].map((i) => (
        <div
          key={i}
          className="voice-bar"
          style={{
            height: `${8 + Math.random() * 12}px`,
            animationDelay: `${(i - 1) * 0.1}s`,
          }}
        />
      ))}
    </div>
  );
}

export default function AIAssistant() {
  const chatMessages   = useAppStore((s) => s.chatMessages);
  const addChatMessage = useAppStore((s) => s.addChatMessage);
  const [input, setInput]     = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEnd = useRef(null);

  useEffect(() => {
    messagesEnd.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const handleSend = async (text) => {
    const query = text || input.trim();
    if (!query) return;

    addChatMessage({ role: 'user', content: query, time: new Date().toLocaleTimeString() });
    setInput('');
    setLoading(true);

    try {
      const res = await sendChatMessage(query);
      addChatMessage({ role: 'ai', content: res.answer, time: new Date().toLocaleTimeString() });
    } catch {
      addChatMessage({ role: 'ai', content: "Sorry, I couldn't connect to the AI service. Make sure the backend is running.", time: new Date().toLocaleTimeString() });
    }
    setLoading(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      style={{ height: 'calc(100vh - var(--topbar-height) - 44px)', display: 'flex', flexDirection: 'column' }}
    >
      {/* Header */}
      <div className="page-header">
        <h1 style={{
          fontFamily: 'var(--font-display)',
          fontSize: '1.2rem',
          letterSpacing: '0.06em',
          background: 'linear-gradient(135deg, #8B5CF6 0%, #00F5FF 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
        }}>
          AI DECISION CORE
        </h1>
        <p>Neural fleet intelligence — ask about operations, pricing & demand</p>
      </div>

      {/* Chat Panel */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        minHeight: 0,
        background: 'rgba(8,12,24,0.7)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(139,92,246,0.15)',
        borderRadius: 16,
        overflow: 'hidden',
        boxShadow: '0 0 40px rgba(139,92,246,0.08), 0 16px 48px rgba(0,0,0,0.5)',
        position: 'relative',
      }}>
        {/* Scanline */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0,
          background: 'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(139,92,246,0.012) 3px, rgba(139,92,246,0.012) 4px)',
          borderRadius: 16,
        }} />

        {/* Messages */}
        <div className="chat-messages" style={{ flex: 1, minHeight: 0, position: 'relative', zIndex: 1 }}>
          {chatMessages.length === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 24,
                padding: 32,
              }}
            >
              {/* 3D Orb */}
              <Suspense fallback={
                <div style={{ width: 160, height: 160, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Sparkles size={40} style={{ color: 'var(--violet)', opacity: 0.5 }} />
                </div>
              }>
                <motion.div animate={{ y: [0, -8, 0] }} transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}>
                  <GlowOrb isTyping={false} size={160} />
                </motion.div>
              </Suspense>

              <div style={{ textAlign: 'center' }}>
                <h3 style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '1rem',
                  letterSpacing: '0.1em',
                  background: 'linear-gradient(135deg, #8B5CF6, #00F5FF)',
                  WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
                  marginBottom: 6,
                }}>
                  VELOAI NEURAL CORE
                </h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                  Fleet intelligence online — ready for queries
                </p>
              </div>

              {/* Suggestion chips */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center', maxWidth: 520 }}>
                {SUGGESTIONS.map((s) => (
                  <motion.button
                    key={s}
                    className="btn btn-secondary"
                    style={{ fontSize: '0.75rem', borderColor: 'rgba(139,92,246,0.25)' }}
                    onClick={() => handleSend(s)}
                    whileHover={{ scale: 1.03, borderColor: 'rgba(139,92,246,0.5)', boxShadow: '0 0 12px rgba(139,92,246,0.15)' }}
                    whileTap={{ scale: 0.97 }}
                  >
                    <Zap size={11} style={{ color: 'var(--violet)' }} />
                    {s}
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}

          <AnimatePresence>
            {chatMessages.map((msg, i) => (
              <motion.div
                key={i}
                className={`chat-message ${msg.role}`}
                initial={{ opacity: 0, y: 12, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              >
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  marginBottom: 5, fontSize: '0.66rem', opacity: 0.65,
                  fontFamily: 'var(--font-mono)',
                }}>
                  {msg.role === 'user'
                    ? <User size={11} />
                    : <Sparkles size={11} style={{ color: 'var(--violet)' }} />}
                  <span style={{ color: msg.role === 'user' ? 'var(--cyan)' : 'var(--violet)' }}>
                    {msg.role === 'user' ? 'YOU' : 'VELOAI'}
                  </span>
                  <span style={{ color: 'var(--text-muted)' }}>· {msg.time}</span>
                </div>
                {msg.content}
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Loading / thinking */}
          <AnimatePresence>
            {loading && (
              <motion.div
                className="chat-message ai"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  fontSize: '0.78rem', color: 'var(--text-muted)',
                  fontFamily: 'var(--font-mono)',
                }}>
                  <VoiceWave />
                  PROCESSING NEURAL QUERY...
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div ref={messagesEnd} />
        </div>

        {/* Input Area */}
        <div className="chat-input-area" style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <input
              className="chat-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Query the neural fleet intelligence..."
              disabled={loading}
              style={{ paddingLeft: 16 }}
            />
            {loading && (
              <div style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)' }}>
                <VoiceWave />
              </div>
            )}
          </div>
          <motion.button
            id="ai-send-btn"
            className="btn btn-primary"
            onClick={() => handleSend()}
            disabled={loading || !input.trim()}
            style={{ padding: '11px 18px', fontFamily: 'var(--font-display)', fontSize: '0.65rem', letterSpacing: '0.08em' }}
            whileHover={{ scale: 1.04, boxShadow: '0 0 30px rgba(0,245,255,0.4)' }}
            whileTap={{ scale: 0.96 }}
          >
            <Send size={15} />
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}
