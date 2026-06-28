import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { joinWaitlist } from '../api';

const REFERRER_TYPES = ['GP', 'SCHOOL', 'SUPPORT_COORDINATOR', 'PAEDIATRICIAN', 'FAMILY'];

export default function WaitlistJoin() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const result = state?.result;

  const [form, setForm] = useState({ referrer_type: '', contact_name: '', organisation_name: '', email: '', phone: '', suburb: '', child_age: '', notes: '' });
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  if (!result) return <div className="p-8"><button onClick={() => navigate('/search')} className="text-blue-600">← Back to search</button></div>;

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      await joinWaitlist({ ...form, child_age: parseInt(form.child_age), availability_object_id: result.availability_object_id });
      setDone(true);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to join waitlist.');
    } finally {
      setLoading(false);
    }
  };

  if (done) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="text-center max-w-sm">
        <div className="text-4xl mb-4">✓</div>
        <h1 className="text-xl font-semibold text-gray-900 mb-2">You're on the waitlist</h1>
        <p className="text-gray-600 mb-6">We'll notify you when {result.clinic_name} opens intake for {result.discipline}.</p>
        <button onClick={() => navigate('/search')} className="text-blue-600">← Back to search</button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-lg mx-auto px-4 py-8">
        <button onClick={() => navigate(-1)} className="text-blue-600 text-sm mb-4">← Back</button>
        <h1 className="text-xl font-semibold text-gray-900 mb-1">Join waitlist</h1>
        <p className="text-gray-500 text-sm mb-6">{result.clinic_name} · {result.discipline}</p>

        <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">I am a</label>
            <div className="grid grid-cols-2 gap-2">
              {REFERRER_TYPES.map((t) => (
                <button type="button" key={t} onClick={() => setForm((f) => ({ ...f, referrer_type: t }))}
                  className={`py-2 px-3 text-sm rounded-lg border transition ${form.referrer_type === t ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-300'}`}>
                  {t.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>

          {[['contact_name', 'Your name', 'text', true], ['organisation_name', 'Organisation (optional)', 'text', false], ['email', 'Email', 'email', true], ['phone', 'Phone (optional)', 'tel', false], ['suburb', 'Your suburb', 'text', true], ['child_age', 'Child age', 'number', true]].map(([k, label, type, required]) => (
            <div key={k}>
              <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
              <input type={type} required={required} value={form[k]} onChange={set(k)} min={type === 'number' ? 0 : undefined} max={type === 'number' ? 18 : undefined}
                className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          ))}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes (optional)</label>
            <textarea value={form.notes} onChange={set('notes')} rows={3}
              className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>

          {error && <p className="text-red-600 text-sm">{error}</p>}

          <button type="submit" disabled={loading}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium disabled:opacity-50">
            {loading ? 'Joining…' : 'Join waitlist'}
          </button>
        </form>
      </div>
    </div>
  );
}
