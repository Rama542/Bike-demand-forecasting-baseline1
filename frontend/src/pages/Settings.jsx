import { useClerk, useUser } from '@clerk/clerk-react';
import { User, Bell, Server, LogOut } from 'lucide-react';

export default function Settings() {
  const { user } = useUser();
  const { signOut } = useClerk();

  const email = user?.primaryEmailAddress?.emailAddress || '';
  const displayName = user?.fullName || user?.firstName || email.split('@')[0] || '';

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
              <input className="input" value={import.meta.env.VITE_API_URL || 'http://localhost:5000/api'} readOnly />
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

        {/* Sign Out */}
        <button
          className="btn btn-secondary"
          onClick={() => signOut({ redirectUrl: '/login' })}
          style={{ color: 'var(--rose)', borderColor: 'rgba(244, 63, 94, 0.3)', gap: '8px' }}
        >
          <LogOut size={16} /> Sign Out
        </button>
      </div>
    </div>
  );
}
