import React from 'react';
import { Navigate } from 'react-router-dom';

export default function AdminGuard({ children }) {
  const key = localStorage.getItem('admin_key');
  if (!key) return <Navigate to="/admin/login" replace />;
  return children;
}
