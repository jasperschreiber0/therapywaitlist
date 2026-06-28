import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getClinics } from '../../lib/adminApi';

const CONFIDENCE_COLOR = (s) => s > 0.7 ? 'text-green-700 bg-green-50' : s >= 0.4 ? 'text-amber-700 bg-amber-50' : 'text-red-700 bg-red-50';

export default function AdminClinics() {
  const [clinics, setClinics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    getClinics().then(setClinics).finally(() => setLoading(false));
  }, []);

  const filtered = clinics.filter((c) =>
    !filter || c.name.toLowerCase().includes(filter.toLowerCase()) || c.suburb.toLowerCase().includes(filter.toLowerCase())
  );

  const needsAttention = (c) => c.availability?.some((a) => a.confidence_score < 0.7);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Clinics</h1>
          <p className="text-gray-500 text-sm">{clinics.length} clinics total</p>
        </div>
        <Link to="/admin/clinics/new" className="bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium">
          Add clinic
        </Link>
      </div>

      <div className="flex gap-3 mb-4">
        <input value={filter} onChange={(e) => setFilter(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-64 focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Filter by name or suburb…" />
        <button onClick={() => setFilter('needs_attention')}
          className={`px-3 py-2 rounded-lg text-sm border transition ${filter === 'needs_attention' ? 'bg-amber-100 border-amber-300 text-amber-800' : 'bg-white border-gray-300 text-gray-600'}`}>
          Needs attention
        </button>
      </div>

      {loading ? (
        <div className="text-gray-400 py-12 text-center">Loading…</div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {['Clinic', 'Suburb', 'Disciplines', 'Min confidence', 'Last updated', ''].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered
                .filter((c) => filter !== 'needs_attention' || needsAttention(c))
                .map((c) => {
                  const minConf = Math.min(...(c.availability?.map((a) => a.confidence_score) || [1]));
                  const lastUpdated = c.availability?.reduce((latest, a) => {
                    const d = new Date(a.last_updated);
                    return d > latest ? d : latest;
                  }, new Date(0));
                  const daysAgo = Math.floor((Date.now() - lastUpdated) / (1000 * 60 * 60 * 24));

                  return (
                    <tr key={c.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => navigate(`/admin/clinics/${c.id}`)}>
                      <td className="px-4 py-3 font-medium text-gray-900">{c.name}</td>
                      <td className="px-4 py-3 text-gray-600">{c.suburb}</td>
                      <td className="px-4 py-3 text-gray-600">{c.availability?.map((a) => a.discipline).join(', ') || '—'}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${CONFIDENCE_COLOR(minConf)}`}>
                          {Math.round(minConf * 100)}%
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-500">{daysAgo === 0 ? 'Today' : `${daysAgo}d ago`}</td>
                      <td className="px-4 py-3 text-right">
                        <span className="text-blue-600 text-xs">View →</span>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
