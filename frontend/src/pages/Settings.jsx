/**
 * Settings.jsx — Works in BOTH Clerk mode and Demo mode
 * -------------------------------------------------------
 * Does NOT directly import useClerk/useUser at module level.
 * Instead, accepts optional props so DemoApp can render it safely.
 */
import { User, Bell, Server, LogOut } from 'lucide-react';

export default function Settings({ clerkUser = null, onSignOut = null }) {
  const email = clerkUser?.primaryEmailAddress?.emailAddress || 'demo@veloai.app';
  const displayName = clerkUser?.fullName || clerkUser?.firstName || email.split('@')[0] || 'Demo User';

  return (
    <div className="animate-in">
      <div className="page-header">
        <h1>Settings</h1>
        <p>Platform configuration &amp; account</p>
      </div>

      <div style={{ maxWidth: '640px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* Account */}
        <div className="card">
          <div className="card-header">
            <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <User size={16} /> Account
            </div>
          </div>
          <div className="card-body">
            <div className="form-group" style={{ marginBottom: '14px' }}>
              <label className="form-label">Email</label>
              <input className="input" value={email} readOnly />
            </div>
            <div className="form-group" style={{ marginBottom: '14px' }}>
              <label className="form-label">Display Name</label>
              <input className="input" value={displayName} readOnly />
            </div>
          </div>
        </div>

        {/* Notifications */}
        <div className="card">
          <div className="card-header">
            <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Bell size={16} /> Notifications
            </div>
          </div>
          <div className="card-body">
            {['Low inventory alerts', 'Demand spike alerts', 'Rebalancing recommendations', 'Revenue reports'].map((item) => (
              <div key={item} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                <span style={{ fontSize: '0.85rem' }}>{item}</span>
                <input type="checkbox" defaultChecked style={{ accentColor: 'var(--cyan)' }} />
              </div>
            ))}
          </div>
        </div>

        {/* API Configuration */}
        <div className="card">
          <div className="card-header">
            <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Server size={16} /> API Configuration
            </div>
          </div>
          <div className="card-body">
            <div className="form-group" style={{ marginBottom: '14px' }}>
              <label className="form-label">Backend API URL</label>
              <input className="input" value={import.meta.env.VITE_API_URL || '/api'} readOnly />
            </div>
            <div className="form-group" style={{ marginBottom: '14px' }}>
              <label className="form-label">Supabase URL</label>
              <input className="input" value={import.meta.env.VITE_SUPABASE_URL || 'Mock Mode'} readOnly />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px' }}>
              <div className="status-dot online" />
              <span className="text-xs text-muted font-mono">Connected</span>
            </div>
          </div>
        </div>

        {/* Sign Out — only shown in Clerk mode */}
        {onSignOut ? (
          <button
            className="btn btn-secondary"
            onClick={onSignOut}
            style={{ color: 'var(--rose)', borderColor: 'rgba(244, 63, 94, 0.3)', gap: '8px' }}
          >
            <LogOut size={16} /> Sign Out
          </button>
        ) : (
          <div className="card" style={{ borderColor: 'rgba(0,245,196,0.2)' }}>
            <div className="card-body" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div className="status-dot online" />
              <span style={{ fontSize: '0.8rem', color: 'var(--cyan)' }}>
                Running in <strong>Demo Mode</strong> — all features available without login
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
