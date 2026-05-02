import { Outlet } from 'react-router-dom';

const AuthLayout = () => {
  return (
    <div className="auth-layout">
      <div className="auth-card-container">
        <div className="auth-card card">
          <Outlet />
        </div>
      </div>

      <style>{`
        .auth-layout {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%);
          padding: 2rem;
        }
        .auth-card-container {
          width: 100%;
          max-width: 450px;
        }
        .auth-card {
          padding: 2.5rem;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
        }
      `}</style>
    </div>
  );
};

export default AuthLayout;
