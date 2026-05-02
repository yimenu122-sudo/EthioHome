import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import RootLayout from './layouts/RootLayout';
import HomePage from './pages/HomePage';
import AuthRoutes from './routes/AuthRoutes';
import RenterRoutes from './routes/RenterRoutes';
import BuyerRoutes from './routes/BuyerRoutes';
import OwnerRoutes from './routes/OwnerRoutes';
import AgentRoutes from './routes/AgentRoutes';
import AdminRoutes from './routes/AdminRoutes';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<RootLayout />}>
          <Route index element={<HomePage />} />
          <Route path="auth/*" element={<AuthRoutes />} />
          <Route path="renter/*" element={<RenterRoutes />} />
          <Route path="buyer/*" element={<BuyerRoutes />} />
          <Route path="owner/*" element={<OwnerRoutes />} />
          <Route path="agent/*" element={<AgentRoutes />} />
          <Route path="admin/*" element={<AdminRoutes />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
