import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';

interface ProtectedRouteProps {
  allowedRoles?: string[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ allowedRoles }) => {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated) {
    // Redirect to login if not authenticated
    return <Navigate to="/auth/login" replace />;
  }

  if (allowedRoles && user) {
    const hasRole = allowedRoles.some(role => role.toLowerCase() === user.role.toLowerCase());
    if (!hasRole) {
      // Redirect to home if role is not allowed
      return <Navigate to="/" replace />;
    }
  }

  return <Outlet />;
};

export default ProtectedRoute;
