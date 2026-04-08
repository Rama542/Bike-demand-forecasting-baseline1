import { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useLocation, useNavigate } from 'react-router-dom';
import { Bot } from 'lucide-react';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import ParticleBackground from '../ParticleBackground';
import ScanlineOverlay from '../ScanlineOverlay';
import CursorGlow from '../CursorGlow';
import { useAppStore } from '../../stores/appStore';
import { initSocket } from '../../lib/socket';

const pageVariants = {
  initial: { opacity: 0, x: 20, filter: 'blur(8px)' },
  animate: { opacity: 1, x: 0, filter: 'blur(0px)', transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
  exit:    { opacity: 0, x: -20, filter: 'blur(8px)', transition: { duration: 0.3, ease: 'easeIn' } },
};

export default function MainLayout({ children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const initLiveUpdates = useAppStore((s) => s.initLiveUpdates);
  const loadStations    = useAppStore((s) => s.loadStations);
  const loadBikes       = useAppStore((s) => s.loadBikes);
  const loadRevenue     = useAppStore((s) => s.loadRevenue);
  const loadDatasetStats = useAppStore((s) => s.loadDatasetStats);

  useEffect(() => {
    initSocket();
    initLiveUpdates();
    loadStations();
    loadBikes();
    loadRevenue();
    loadDatasetStats();
    const interval = setInterval(() => { loadStations(); loadBikes(); }, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="app-layout">
      {/* Fixed full-screen layers */}
      <ParticleBackground />
      <ScanlineOverlay />
      <CursorGlow />

      <Sidebar />

      <div className="main-content">
        <TopBar />
        <div className="page-content">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              style={{ height: '100%' }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
      
      {/* Floating AI Assistant Button */}
      {location.pathname !== '/ai' && (
        <motion.button
          onClick={() => navigate('/ai')}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          whileHover={{ scale: 1.1, boxShadow: '0 0 30px rgba(123,97,255,0.6)' }}
          whileTap={{ scale: 0.9 }}
          style={{
            position: 'absolute',
            bottom: 30,
            right: 30,
            width: 60,
            height: 60,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #7B61FF, #00F5FF)',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            boxShadow: '0 8px 32px rgba(123,97,255,0.5), inset 0 0 20px rgba(255,255,255,0.2)',
            cursor: 'pointer',
            zIndex: 1000
          }}
        >
          <Bot size={28} />
        </motion.button>
      )}
    </div>
  );
}
