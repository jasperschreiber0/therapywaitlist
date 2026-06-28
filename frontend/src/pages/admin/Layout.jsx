import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';

const NAV = [
  { to: '/admin/clinics', label: 'Clinics' },
  { to: '/admin/availability', label: 'Availability' },
  { to: '/admin/analytics', label: 'Analytics' },
  { to: '/admin/freshness', label: 'Freshness' },
];

export default function AdminLayout() {
  const navigate = useNavigate();

  const signOut = () => {
    localStorage.removeItem('admin_key');
    navigate('/admin/login');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <span className="font-semibold text-gray-900 text-sm">TherapyWaitlist Admin</span>
          <div className="flex gap-1">
            {NAV.map(({ to, label }) => (
              <NavLink key={to} to={to}
                className={({ isActive }) => `px-3 py-1.5 rounded-md text-sm font-medium transition ${isActive ? 'bg-gray-100 text-gray-900' : 'text-gray-500 hover:text-gray-900'}`}>
                {label}
              </NavLink>
            ))}
          </div>
        </div>
        <button onClick={signOut} className="text-gray-400 text-sm hover:text-gray-600">Sign out</button>
      </nav>
      <main className="max-w-6xl mx-auto px-4 py-8">
        <Outlet />
      </main>
    </div>
  );
}
