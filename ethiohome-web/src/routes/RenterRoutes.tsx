import { Route, Routes } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import RenterHome from '../pages/renter/Home';

const RenterRoutes = () => {
  return (
    <Routes>
      {/* Publicly accessible route for guests */}
      <Route path="home" element={<RenterHome />} />
      
      {/* Protected routes requiring login as 'renter' */}
      <Route element={<ProtectedRoute allowedRoles={['renter']} />}>
        <Route path="bookmarks" element={<div>Bookmarked Properties</div>} />
        <Route path="history" element={<div>Rental History</div>} />
      </Route>
    </Routes>
  );
};

export default RenterRoutes;
