import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { submitFreshnessUpdate } from '../../api';

const WAIT_OPTIONS = [
  ['UNDER_1_WEEK', 'Under 1 week'],
  ['ONE_TWO_WEEKS', '1–2 weeks'],
  ['TWO_FOUR_WEEKS', '2–4 weeks'],
  ['FOUR_EIGHT_WEEKS', '4–8 weeks'],
  ['EIGHT_PLUS_WEEKS', '8+ weeks'],
];

export default function UpdateForm() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState({ intake_status: '', wait_time_band: '', capacity_level: '', monthly_referral_cap: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      await submitFreshnessUpdate(token, {
        ...form,
        monthly_referral_cap: form.intake_status === 'LIMITED' && form.monthly_referral_cap ? parseInt(form.monthly_referral_cap) : null,
      });
      navigate('/freshness/confirmed');
    } catch (err) {
      setError(err.response?.data?.error || 'Update failed. Your link may have expired.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-md mx-auto px-4 py-10">
        <h1 className="text-xl font-semibold text-gray-900 mb-1">Update your availability</h1>
        <p className="text-gray-500 text-sm mb-6">Takes about 30 seconds.</p>

        <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Intake status</label>
            <div className="grid grid-cols-3 gap-2">
              {[['OPEN', 'Open'], ['LIMITED', 'Limited'], ['CLOSED', 'Closed']].map(([v, l]) => (
                <button type="button" key={v} onClick={() => set('intake_status', v)}
                  className={`py-3 rounded-lg border text-sm font-medium transition ${form.intake_status === v ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-300'}`}>
                  {l}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Wait time</label>
            <select value={form.wait_time_band} onChange={(e) => set('wait_time_band', e.target.value)}
              className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">Select…</option>
              {WAIT_OPTIONS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Capacity</label>
            <div className="grid grid-cols-3 gap-2">
              {[['LOW', 'Low'], ['MEDIUM', 'Medium'], ['HIGH', 'High']].map(([v, l]) => (
                <button type="button" key={v} onClick={() => set('capacity_level', v)}
                  className={`py-3 rounded-lg border text-sm font-medium transition ${form.capacity_level === v ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-300'}`}>
                  {l}
                </button>
              ))}
            </div>
          </div>

          {form.intake_status === 'LIMITED' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Monthly referral cap</label>
              <input type="number" min="1" value={form.monthly_referral_cap} onChange={(e) => set('monthly_referral_cap', e.target.value)}
                className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="e.g. 5" />
            </div>
          )}

          {error && <p className="text-red-600 text-sm">{error}</p>}

          <button type="submit" disabled={loading || !form.intake_status || !form.wait_time_band || !form.capacity_level}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium disabled:opacity-50">
            {loading ? 'Saving…' : 'Save changes'}
          </button>
        </form>
      </div>
    </div>
  );
}
