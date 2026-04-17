import React from 'react';
import DashboardPage from './DashboardPage';
import AdminPage from './AdminPage';
import { isAdmin } from '../services/auth';

const DashboardEntryPage = () => {
  return isAdmin() ? <AdminPage /> : <DashboardPage />;
};

export default DashboardEntryPage;
