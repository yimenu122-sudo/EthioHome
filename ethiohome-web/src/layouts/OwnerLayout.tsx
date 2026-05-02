import { Outlet, Link } from 'react-router-dom';
import { LayoutDashboard, Building2, PlusCircle, MessageSquare, User, LogOut } from 'lucide-react';

const OwnerLayout = () => {
  return (
    <div className="role-layout">
      <aside className="sidebar">
        <div className="sidebar-header">
          <Link to="/" className="logo">🏠 EthioHome</Link>
          <span className="role-badge" style={{ backgroundColor: '#4f46e510', color: 'var(--primary)' }}>Owner</span>
        </div>
        
        <nav className="sidebar-nav">
          <Link to="/owner/dashboard" className="nav-item"><LayoutDashboard size={20} /> Dashboard</Link>
          <Link to="/owner/my-properties" className="nav-item"><Building2 size={20} /> My Properties</Link>
          <Link to="/owner/add-property" className="nav-item"><PlusCircle size={20} /> List New Property</Link>
          <Link to="/owner/offers" className="nav-item"><MessageSquare size={20} /> Offers & Inquiries</Link>
          <Link to="/owner/profile" className="nav-item"><User size={20} /> Profile</Link>
        </nav>

        <div className="sidebar-footer">
          <button className="nav-item logout-btn"><LogOut size={20} /> Logout</button>
        </div>
      </aside>

      <main className="content">
        <header className="content-header">
          <h2>Property Management</h2>
          <div className="user-info">
            <div className="avatar">O</div>
          </div>
        </header>
        <section className="page-wrapper">
          <Outlet />
        </section>
      </main>

      <style>{`
        .role-layout { display: flex; min-height: 100vh; }
        .sidebar { width: 260px; background: var(--surface); border-right: 1px solid var(--border); display: flex; flex-direction: column; padding: 1.5rem; position: sticky; top: 0; height: 100vh; }
        .sidebar-header { margin-bottom: 2.5rem; }
        .logo { font-size: 1.25rem; font-weight: 700; color: var(--primary); display: block; margin-bottom: 0.5rem; }
        .role-badge { font-size: 0.75rem; padding: 0.25rem 0.625rem; border-radius: 1rem; font-weight: 600; }
        .sidebar-nav { flex: 1; display: flex; flex-direction: column; gap: 0.5rem; }
        .nav-item { display: flex; align-items: center; gap: 0.75rem; padding: 0.75rem 1rem; border-radius: var(--radius); color: var(--text-muted); font-weight: 500; transition: all 0.2s; }
        .nav-item:hover { background: var(--background); color: var(--primary); }
        .content { flex: 1; background: var(--background); display: flex; flex-direction: column; }
        .content-header { height: 4.5rem; background: var(--surface); border-bottom: 1px solid var(--border); display: flex; align-items: center; justify-content: space-between; padding: 0 2rem; }
        .page-wrapper { padding: 2rem; flex: 1; }
        .avatar { width: 2.5rem; height: 2.5rem; background: var(--primary); color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 700; }
      `}</style>
    </div>
  );
};

export default OwnerLayout;
