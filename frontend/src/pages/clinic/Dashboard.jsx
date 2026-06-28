import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getClinicDashboard } from '../../api';

const WAIT_LABELS = { UNDER_1_WEEK: '<1 wk', ONE_TWO_WEEKS: '1–2 wks', TWO_FOUR_WEEKS: '2–4 wks', FOUR_EIGHT_WEEKS: '4–8 wks', EIGHT_PLUS_WEEKS: '8+ wks' };
const STATUS_STYLES = { OPEN: 'bg-green-100 text-green-800', LIMITED: 'bg-amber-100 text-amber-800', CLOSED: 'bg-gray-100 text-gray-600' };

export default function Dashboard() {
  const { clinic_id } = useParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    getClinicDashboard(clinic_id).then(setData).catch(() => setError('Failed to load dashboard'));
  }, [clinic_id]);

  if (error) return <div className="p-8 text-red-600">{error}</div>;
  if (!data) return <div className="p-8 text-gray-400">Loading…</div>;

  const { clinic, search_count_this_week } = data;
  const lowConfidence = clinic.availability.filter((a) => a.confidence_score < 0.7);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-xl font-semibold text-gray-900 mb-1">{clinic.name}</h1>
        <p className="text-gray-500 text-sm mb-6">{clinic.suburb}</p>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 text-sm text-blue-800">
          You've appeared in <strong>{search_count_this_week}</strong> referral searches this week.
        </div>

        {lowConfidence.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6 text-sm text-amber-800">
            ⚠ {lowConfidence.length} listing{lowConfidence.length > 1 ? 's' : ''} need{lowConfidence.length === 1 ? 's' : ''} updating to stay visible in searches.
          </div>
        )}

        <h2 className="font-medium text-gray-700 mb-3">Availability</h2>
        <div className="space-y-3 mb-8">
          {clinic.availability.map((ao) => (
            <div key={ao.id} className="bg-white rounded-xl border border-gray-200 p-4 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-gray-900 text-sm">{ao.discipline}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_STYLES[ao.intake_status]}`}>{ao.intake_status}</span>
                </div>
                <p className="text-xs text-gray-500">Wait: {WAIT_LABELS[ao.wait_time_band]} · Capacity: {ao.capacity_level} · Confidence: {Math.round(ao.confidence_score * 100)}%</p>
              </div>
              <Link to={`/clinic/${clinic_id}/availability/${ao.id}/edit`}
                className="text-blue-600 text-sm font-medium ml-4 shrink-0">Update</Link>
            </div>
          ))}
        </div>

        <div className="flex gap-3">
          <Link to={`/clinic/${clinic_id}/waitlist`} className="text-blue-600 text-sm">View waitlist →</Link>
          <Link to={`/clinic/${clinic_id}/profile`} className="text-blue-600 text-sm">Clinic profile →</Link>
        </div>
      </div>
    </div>
  );
}
