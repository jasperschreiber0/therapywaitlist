import React, { useEffect, useState } from 'react';
import { getAnalytics } from '../../lib/adminApi';

function StatCard({ label, value, sub }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5">
      <p className="text-sm text-gray-500 mb-1">{label}</p>
      <p className="text-3xl font-semibold text-gray-900">{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  );
}

export default function AdminAnalytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { getAnalytics().then(setData).finally(() => setLoading(false)); }, []);

  if (loading) return <div className="text-gray-400 py-12 text-center">Loading…</div>;
  if (!data) return null;

  return (
    <div>
      <h1 className="text-xl font-semibold text-gray-900 mb-6">Analytics</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard label="Searches (7 days)" value={data.searches_7d} />
        <StatCard label="Searches (30 days)" value={data.searches_30d} />
        <StatCard label="Clinic contacts (7 days)" value={data.conversions_7d} sub={`${data.conversion_rate}% conversion`} />
        <StatCard label="Freshness health" value={`${data.freshness_health_pct}%`} sub="Records updated last 7 days" />
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <h2 className="font-medium text-gray-700 mb-4">Waitlist entries by clinic</h2>
        {data.waitlist_entries?.length > 0 ? (
          <div className="space-y-2">
            {data.waitlist_entries.map((w, i) => (
              <div key={i} className="flex justify-between items-center text-sm py-2 border-b border-gray-100 last:border-0">
                <span className="text-gray-700">{w.availability_object_id}</span>
                <span className="font-medium text-gray-900">{w._count} entries</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-400 text-sm">No waitlist entries yet.</p>
        )}
      </div>
    </div>
  );
}
