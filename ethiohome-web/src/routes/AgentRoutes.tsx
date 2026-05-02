import { Route, Routes } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';

const AgentRoutes = () => {
  return (
    <Routes>
      <Route element={<ProtectedRoute allowedRoles={['agent']} />}>
        <Route path="dashboard" element={<div>Agent Dashboard</div>} />
        <Route path="managed-properties" element={<div>Managed Properties</div>} />
        <Route path="clients" element={<div>My Clients</div>} />
      </Route>
    </Routes>
  );
};

export default AgentRoutes;
