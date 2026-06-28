import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAvailability, updateAvailability } from '../../lib/adminApi';

const CONF_COLOR = (s) => s > 0.7 ? 'bg-green-100 text-green-700' : s >= 0.4 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700';
const WAIT_LABELS = { UNDER_1_WEEK: '<1 wk', ONE_TWO_WEEKS: '1–2 wks', TWO_FOUR_WEEKS: '2–4 wks', FOUR_EIGHT_WEEKS: '4–8 wks', EIGHT_PLUS_WEEKS: '8+ wks' };

function daysAgo(d) {
  const n = Math.floor((Date.now() - new Date(d)) / (1000 * 60 * 60 * 24));
  return n === 0 ? 'Today' : `${n}d ago`;
}

export default function AdminAvailability() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [selected, setSelected] = useState([]);
  const navigate = useNavigate();

  useEffect(() => { getAvailability().then(setRecords).finally(() => setLoading(false)); }, []);

  const filtered = records.filter((r) => {
    if (filter === 'needs_attention') return r.confidence_score < 0.7 || Math.floor((Date.now() - new Date(r.last_updated)) / (1000 * 60 * 60 * 24)) >= 14;
    if (filter === 'low') return r.confidence_score < 0.4;
    return true;
  });

  const forceRefresh = async (id) => {
    await updateAvailability(id, { confidence_score: 1.0 });
    setRecords((prev) => prev.map((r) => r.id === id ? { ...r, confidence_score: 1.0 } : r));
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Availability</h1>
          <p className="text-gray-500 text-sm">{records.length} records total</p>
        </div>
      </div>

      <div className="flex gap-2 mb-4">
        {[['all', 'All'], ['needs_attention', 'Needs attention'], ['low', 'Low confidence']].map(([val, label]) => (
          <button key={val} onClick={() => setFilter(val)}
            className={`px-3 py-1.5 rounded-full text-sm border transition ${filter === val ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-600 border-gray-300'}`}>
            {label}
          </button>
        ))}
      </div>

      {loading ? <div className="text-gray-400 py-12 text-center">Loading…</div> : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {['Clinic', 'Discipline', 'Status', 'Wait', 'Confidence', 'Last updated', 'Updated by', ''].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((r) => (
                <tr key={r.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <button onClick={() => navigate(`/admin/clinics/${r.clinic_id}`)} className="font-medium text-gray-900 hover:text-blue-600 text-left">
                      {r.clinic?.name}
                    </button>
                    <p className="text-gray-400 text-xs">{r.clinic?.suburb}</p>
                  </td>
                  <td className="px-4 py-3 text-gray-700">{r.discipline}</td>
                  <td className="px-4 py-3 text-gray-700">{r.intake_status}</td>
                  <td className="px-4 py-3 text-gray-600">{WAIT_LABELS[r.wait_time_band]}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${CONF_COLOR(r.confidence_score)}`}>
                      {Math.round(r.confidence_score * 100)}%
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{daysAgo(r.last_updated)}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{r.updated_by}</td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => forceRefresh(r.id)} className="text-blue-600 text-xs hover:underline">Reset</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
