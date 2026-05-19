import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { isAuthenticated } from '../services/auth';
import PageSeo from './PageSeo';

const ProtectedRoute = () => {
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }

  return (
    <>
      <PageSeo pageKey="private" noindex />
      <Outlet />
    </>
  );
};

export default ProtectedRoute;