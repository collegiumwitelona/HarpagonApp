import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { isAdmin, isAuthenticated } from '../services/auth';

const PublicOnlyRoute = () => {
  if (isAuthenticated()) {
    return <Navigate to={isAdmin() ? '/admin' : '/dashboard'} replace />;
  }

  return <Outlet />;
};

export default PublicOnlyRoute;