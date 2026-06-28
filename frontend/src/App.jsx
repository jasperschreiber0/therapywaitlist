import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// Referrer / public
import Search from './pages/Search';
import Results from './pages/Results';
import WaitlistJoin from './pages/WaitlistJoin';

// Freshness (token-auth, no login)
import Confirmed from './pages/freshness/Confirmed';
import UpdateForm from './pages/freshness/UpdateForm';

// Clinic admin
import Dashboard from './pages/clinic/Dashboard';
import EditAvailability from './pages/clinic/EditAvailability';
import ClinicWaitlist from './pages/clinic/Waitlist';
import Profile from './pages/clinic/Profile';

// Admin panel
import AdminLogin from './pages/admin/Login';
import AdminLayout from './pages/admin/Layout';
import AdminClinics from './pages/admin/Clinics';
import ClinicDetail from './pages/admin/ClinicDetail';
import NewClinic from './pages/admin/NewClinic';
import AdminAvailability from './pages/admin/Availability';
import AdminAnalytics from './pages/admin/Analytics';
import AdminFreshness from './pages/admin/Freshness';
import AdminGuard from './components/AdminGuard';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path="/" element={<Navigate to="/search" replace />} />
        <Route path="/search" element={<Search />} />
        <Route path="/search/results" element={<Results />} />
        <Route path="/waitlist/join" element={<WaitlistJoin />} />

        {/* Freshness (token-based, no account) */}
        <Route path="/freshness/confirmed" element={<Confirmed />} />
        <Route path="/freshness/update/:token" element={<UpdateForm />} />

        {/* Clinic admin (JWT session) */}
        <Route path="/clinic/:clinic_id/dashboard" element={<Dashboard />} />
        <Route path="/clinic/:clinic_id/availability/:ao_id/edit" element={<EditAvailability />} />
        <Route path="/clinic/:clinic_id/waitlist" element={<ClinicWaitlist />} />
        <Route path="/clinic/:clinic_id/profile" element={<Profile />} />

        {/* Admin panel */}
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin" element={<AdminGuard><AdminLayout /></AdminGuard>}>
          <Route index element={<Navigate to="/admin/clinics" replace />} />
          <Route path="clinics" element={<AdminClinics />} />
          <Route path="clinics/new" element={<NewClinic />} />
          <Route path="clinics/:id" element={<ClinicDetail />} />
          <Route path="availability" element={<AdminAvailability />} />
          <Route path="analytics" element={<AdminAnalytics />} />
          <Route path="freshness" element={<AdminFreshness />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
