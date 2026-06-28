import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function AdminLogin() {
  const navigate = useNavigate();
  const [key, setKey] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      // Verify the key works by hitting a lightweight admin endpoint
      await axios.get('/api/admin/clinics', { headers: { Authorization: `Bearer ${key}` } });
      localStorage.setItem('admin_key', key);
      navigate('/admin/clinics');
    } catch (err) {
      setError(err.response?.status === 401 ? 'Invalid admin key' : 'Connection error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <h1 className="text-xl font-semibold text-gray-900 mb-1 text-center">TherapyWaitlist Admin</h1>
        <p className="text-gray-500 text-sm text-center mb-8">Internal operations panel</p>
        <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Admin key</label>
            <input type="password" value={key} onChange={(e) => setKey(e.target.value)} required
              className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter admin API key" />
          </div>
          {error && <p className="text-red-600 text-sm">{error}</p>}
          <button type="submit" disabled={loading}
            className="w-full bg-gray-900 text-white py-3 rounded-lg font-medium text-sm disabled:opacity-50">
            {loading ? 'Verifying…' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  );
}
