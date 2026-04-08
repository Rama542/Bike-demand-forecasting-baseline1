import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '../../stores/appStore';
import {
  LayoutDashboard, Map, BarChart3, Bot, Settings,
  Bike, ChevronLeft, ChevronRight, LogOut,
} from 'lucide-react';

const navItems = [
  { path: '/',          label: 'Dashboard',   icon: LayoutDashboard, section: 'overview' },
  { path: '/fleet',     label: 'Fleet & Map', icon: Map,             section: 'overview' },
  { path: '/analytics', label: 'Analytics',   icon: BarChart3,       section: 'intelligence' },
  { path: '/ai',        label: 'AI Assistant',icon: Bot,             section: 'intelligence' },
  { path: '/settings',  label: 'Settings',    icon: Settings,        section: 'system' },
];

const sections = [
  { key: 'overview',      label: 'Overview' },
  { key: 'intelligence',  label: 'Intelligence' },
  { key: 'system',        label: 'System' },
];

export default function Sidebar() {
  const location  = useLocation();
  const navigate  = useNavigate();
  const collapsed = useAppStore((s) => s.sidebarCollapsed);
  const toggleSidebar = useAppStore((s) => s.toggleSidebar);
  const logout    = useAppStore((s) => s.logout);
  const user      = useAppStore((s) => s.user);

  return (
    <nav className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      {/* Header */}
      <div className="sidebar-header">
        <motion.div
          className="sidebar-logo"
          whileHover={{ scale: 1.08 }}
          transition={{ type: 'spring', stiffness: 400 }}
        >
          <Bike size={18} />
        </motion.div>
        <AnimatePresence>
          {!collapsed && (
            <motion.div
              className="sidebar-brand"
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ duration: 0.2 }}
            >
              VeloAI
              <small>Fleet Platform v4</small>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Nav */}
      <div className="sidebar-nav">
        {sections.map((section) => (
          <div key={section.key}>
            {!collapsed && (
              <div className="nav-section-label">{section.label}</div>
            )}
            {navItems
              .filter((item) => item.section === section.key)
              .map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <motion.button
                    key={item.path}
                    className={`nav-item ${isActive ? 'active' : ''}`}
                    onClick={() => navigate(item.path)}
                    title={collapsed ? item.label : ''}
                    whileHover={{ x: collapsed ? 0 : 3 }}
                    whileTap={{ scale: 0.97 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                  >
                    <Icon size={18} />
                    <AnimatePresence>
                      {!collapsed && (
                        <motion.span
                          className="nav-label"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.15 }}
                        >
                          {item.label}
                        </motion.span>
                      )}
                    </AnimatePresence>

                    {/* Active indicator dot when collapsed */}
                    {isActive && collapsed && (
                      <motion.div
                        layoutId="collapsed-dot"
                        style={{
                          position: 'absolute',
                          right: 8,
                          width: 5,
                          height: 5,
                          borderRadius: '50%',
                          background: 'var(--cyan)',
                          boxShadow: '0 0 6px var(--cyan)',
                        }}
                      />
                    )}
                  </motion.button>
                );
              })}
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="sidebar-footer">
        <motion.button
          className="nav-item"
          onClick={toggleSidebar}
          title="Toggle sidebar"
          whileTap={{ scale: 0.95 }}
        >
          <motion.div
            animate={{ rotate: collapsed ? 0 : 180 }}
            transition={{ duration: 0.3 }}
          >
            {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </motion.div>
          {!collapsed && <span className="nav-label">Collapse</span>}
        </motion.button>

        <motion.button
          className="nav-item"
          onClick={logout}
          title="Sign out"
          style={{ color: 'var(--rose)' }}
          whileHover={{ x: 3 }}
          whileTap={{ scale: 0.97 }}
        >
          <LogOut size={18} />
          {!collapsed && <span className="nav-label">Sign Out</span>}
        </motion.button>

        <AnimatePresence>
          {user && !collapsed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{
                padding: '8px 12px',
                fontSize: '0.65rem',
                color: 'var(--text-muted)',
                fontFamily: 'var(--font-mono)',
                letterSpacing: '0.04em',
                borderTop: '1px solid rgba(0,245,255,0.05)',
                marginTop: 4,
              }}
            >
              <span style={{ color: 'rgba(0,245,255,0.3)' }}>◈</span> {user.email}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </nav>
  );
}
