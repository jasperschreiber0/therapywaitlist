import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';

export default function Profile() {
  const { clinic_id } = useParams();
  const [clinic, setClinic] = useState(null);

  useEffect(() => {
    axios.get(`/api/clinic/${clinic_id}/profile`).then((r) => setClinic(r.data));
  }, [clinic_id]);

  if (!clinic) return <div className="p-8 text-gray-400">Loading…</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-lg mx-auto px-4 py-8">
        <Link to={`/clinic/${clinic_id}/dashboard`} className="text-blue-600 text-sm mb-4 block">← Dashboard</Link>
        <h1 className="text-xl font-semibold text-gray-900 mb-6">{clinic.name}</h1>

        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4 text-sm">
          {[['Address', clinic.address], ['Suburb', clinic.suburb], ['Phone', clinic.phone], ['Website', clinic.website || '—']].map(([k, v]) => (
            <div key={k} className="flex gap-4">
              <span className="w-24 text-gray-500 shrink-0">{k}</span>
              <span className="text-gray-900">{v}</span>
            </div>
          ))}
          <div className="flex gap-4">
            <span className="w-24 text-gray-500 shrink-0">Services</span>
            <div className="flex gap-2 flex-wrap">
              {clinic.ndis_registered && <span className="bg-purple-100 text-purple-700 px-2 py-0.5 rounded text-xs">NDIS</span>}
              {clinic.bulk_billing && <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded text-xs">Bulk billing</span>}
              {clinic.private_health && <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-xs">Private health</span>}
            </div>
          </div>
        </div>

        <p className="text-xs text-gray-400 mt-4">To update your clinic profile, contact <a href={`mailto:${import.meta.env.VITE_ADMIN_EMAIL || 'admin@therapywaitlist.com.au'}`} className="underline">admin@therapywaitlist.com.au</a></p>
      </div>
    </div>
  );
}
