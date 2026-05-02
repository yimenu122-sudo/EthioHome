import { Route, Routes } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import DashboardPage from '../pages/owner/Dashboard';
import MyPropertiesPage from '../pages/owner/MyProperties';
import AddEditPropertyPage from '../pages/owner/AddEditProperty';

const OwnerRoutes = () => {
  return (
    <Routes>
      <Route element={<ProtectedRoute allowedRoles={['owner']} />}>
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="my-properties" element={<MyPropertiesPage />} />
        <Route path="add-property" element={<AddEditPropertyPage />} />
      </Route>
    </Routes>
  );
};

export default OwnerRoutes;
