import { Outlet, Link } from 'react-router-dom';
import { Shield, Users, Building, Percent, BarChart3, AlertCircle, Settings, LogOut } from 'lucide-react';

const AdminLayout = () => {
  return (
    <div className="role-layout">
      <aside className="sidebar">
        <div className="sidebar-header">
          <Link to="/" className="logo">🏠 EthioHome</Link>
          <span className="role-badge" style={{ backgroundColor: '#ef444410', color: 'var(--error)' }}>Administrator</span>
        </div>
        
        <nav className="sidebar-nav">
          <Link to="/admin/dashboard" className="nav-item"><BarChart3 size={20} /> System Overview</Link>
          <Link to="/admin/users" className="nav-item"><Users size={20} /> User Management</Link>
          <Link to="/admin/properties" className="nav-item"><Building size={20} /> Property Audits</Link>
          <Link to="/admin/agents" className="nav-item"><Shield size={20} /> Agent Verification</Link>
          <Link to="/admin/disputes" className="nav-item"><AlertCircle size={20} /> Dispute Center</Link>
          <Link to="/admin/reports" className="nav-item"><BarChart3 size={20} /> Financial Reports</Link>
          <Link to="/admin/settings" className="nav-item"><Settings size={20} /> System Settings</Link>
        </nav>

        <div className="sidebar-footer">
          <button className="nav-item logout-btn"><LogOut size={20} /> Logout</button>
        </div>
      </aside>

      <main className="content">
        <header className="content-header">
          <h2 style={{ color: 'var(--error)' }}>Admin Control Panel</h2>
          <div className="user-info">
            <div className="avatar" style={{ backgroundColor: 'var(--error)' }}>AD</div>
          </div>
        </header>
        <section className="page-wrapper">
          <Outlet />
        </section>
      </main>

      <style>{`
        .role-layout { display: flex; min-height: 100vh; }
        .sidebar { width: 280px; background: var(--surface); border-right: 1px solid var(--border); display: flex; flex-direction: column; padding: 1.5rem; position: sticky; top: 0; height: 100vh; }
        .sidebar-header { margin-bottom: 2.5rem; }
        .logo { font-size: 1.25rem; font-weight: 700; color: var(--primary); display: block; margin-bottom: 0.5rem; }
        .role-badge { font-size: 0.75rem; padding: 0.25rem 0.625rem; border-radius: 1rem; font-weight: 600; }
        .sidebar-nav { flex: 1; display: flex; flex-direction: column; gap: 0.5rem; }
        .nav-item { display: flex; align-items: center; gap: 0.75rem; padding: 0.75rem 1rem; border-radius: var(--radius); color: var(--text-muted); font-weight: 500; transition: all 0.2s; }
        .nav-item:hover { background: var(--background); color: var(--primary); }
        .content { flex: 1; background: var(--background); display: flex; flex-direction: column; }
        .content-header { height: 4.5rem; background: var(--surface); border-bottom: 1px solid var(--border); display: flex; align-items: center; justify-content: space-between; padding: 0 2rem; }
        .page-wrapper { padding: 2rem; flex: 1; }
        .avatar { width: 2.5rem; height: 2.5rem; color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 700; }
      `}</style>
    </div>
  );
};

export default AdminLayout;
