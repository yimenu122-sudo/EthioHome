import { Route, Routes } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import BuyerHome from '../pages/buyer/Home';

const BuyerRoutes = () => {
  return (
    <Routes>
      {/* Publicly accessible route for guests */}
      <Route path="home" element={<BuyerHome />} />
      
      {/* Protected routes requiring login as 'buyer' */}
      <Route element={<ProtectedRoute allowedRoles={['buyer']} />}>
        <Route path="saved" element={<div>Saved Listings</div>} />
        <Route path="offers" element={<div>My Offers</div>} />
      </Route>
    </Routes>
  );
};

export default BuyerRoutes;
