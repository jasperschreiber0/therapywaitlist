import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Search from './pages/Search';
import Results from './pages/Results';
import WaitlistJoin from './pages/WaitlistJoin';
import Confirmed from './pages/freshness/Confirmed';
import UpdateForm from './pages/freshness/UpdateForm';
import Dashboard from './pages/clinic/Dashboard';
import EditAvailability from './pages/clinic/EditAvailability';
import ClinicWaitlist from './pages/clinic/Waitlist';
import Profile from './pages/clinic/Profile';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/search" replace />} />
        <Route path="/search" element={<Search />} />
        <Route path="/search/results" element={<Results />} />
        <Route path="/waitlist/join" element={<WaitlistJoin />} />
        <Route path="/freshness/confirmed" element={<Confirmed />} />
        <Route path="/freshness/update/:token" element={<UpdateForm />} />
        <Route path="/clinic/:clinic_id/dashboard" element={<Dashboard />} />
        <Route path="/clinic/:clinic_id/availability/:ao_id/edit" element={<EditAvailability />} />
        <Route path="/clinic/:clinic_id/waitlist" element={<ClinicWaitlist />} />
        <Route path="/clinic/:clinic_id/profile" element={<Profile />} />
      </Routes>
    </BrowserRouter>
  );
}
