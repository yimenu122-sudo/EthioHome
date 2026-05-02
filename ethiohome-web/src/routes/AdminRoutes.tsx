import { Route, Routes } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';

const AdminRoutes = () => {
  return (
    <Routes>
      <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
        <Route path="dashboard" element={<div>Admin Dashboard</div>} />
        <Route path="users" element={<div>User Management</div>} />
        <Route path="settings" element={<div>System Settings</div>} />
      </Route>
    </Routes>
  );
};

export default AdminRoutes;
