import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';

export default function ClinicWaitlist() {
  const { clinic_id } = useParams();
  const [data, setData] = useState(null);

  useEffect(() => {
    axios.get(`/api/clinic/${clinic_id}/waitlist`).then((r) => setData(r.data));
  }, [clinic_id]);

  if (!data) return <div className="p-8 text-gray-400">Loading…</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <Link to={`/clinic/${clinic_id}/dashboard`} className="text-blue-600 text-sm mb-4 block">← Dashboard</Link>
        <h1 className="text-xl font-semibold text-gray-900 mb-6">Waitlist</h1>

        {data.entries.length === 0 ? (
          <p className="text-gray-500">No waitlist entries yet.</p>
        ) : (
          <div className="space-y-3">
            {data.entries.map((e) => (
              <div key={e.id} className="bg-white rounded-xl border border-gray-200 p-4">
                <div className="flex justify-between items-start mb-2">
                  <span className="font-medium text-gray-900 text-sm">{e.discipline}</span>
                  <span className="text-xs text-gray-500">{new Date(e.date_added).toLocaleDateString('en-AU')}</span>
                </div>
                <div className="text-sm text-gray-600 space-y-1">
                  <p>Age: {e.child_age} · Urgency: {e.urgency_score}/10 · Referrer: {e.referrer_type}</p>
                  {e.referrer_contact && <p className="text-gray-900">Contact: {e.referrer_contact} — {e.referrer_email}</p>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
