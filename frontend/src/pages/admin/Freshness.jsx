import React, { useEffect, useState } from 'react';
import { getFreshness, resendPrompt } from '../../lib/adminApi';

const RESPONSE_BADGE = {
  CONFIRMED: 'bg-green-100 text-green-700',
  UPDATED: 'bg-blue-100 text-blue-700',
  NO_RESPONSE: 'bg-red-100 text-red-700',
  null: 'bg-gray-100 text-gray-500',
};

function daysAgo(d) {
  const n = Math.floor((Date.now() - new Date(d)) / (1000 * 60 * 60 * 24));
  return n === 0 ? 'Today' : `${n}d ago`;
}

export default function AdminFreshness() {
  const [prompts, setPrompts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [resending, setResending] = useState(null);

  useEffect(() => { getFreshness().then(setPrompts).finally(() => setLoading(false)); }, []);

  const filtered = prompts.filter((p) => {
    if (filter === 'no_response') return !p.response_type || p.response_type === 'NO_RESPONSE';
    return true;
  });

  // Group by week
  const byWeek = filtered.reduce((acc, p) => {
    const week = new Date(p.sent_at);
    week.setDate(week.getDate() - week.getDay());
    const key = week.toLocaleDateString('en-AU', { day: 'numeric', month: 'short' });
    if (!acc[key]) acc[key] = [];
    acc[key].push(p);
    return acc;
  }, {});

  const handleResend = async (id) => {
    setResending(id);
    try { await resendPrompt(id); } finally { setResending(null); }
  };

  return (
    <div>
      <h1 className="text-xl font-semibold text-gray-900 mb-6">Freshness log</h1>

      <div className="flex gap-2 mb-6">
        {[['all', 'All prompts'], ['no_response', 'No response']].map(([val, label]) => (
          <button key={val} onClick={() => setFilter(val)}
            className={`px-3 py-1.5 rounded-full text-sm border transition ${filter === val ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-600 border-gray-300'}`}>
            {label}
          </button>
        ))}
      </div>

      {loading ? <div className="text-gray-400 py-12 text-center">Loading…</div> : (
        <div className="space-y-8">
          {Object.entries(byWeek).map(([week, items]) => {
            const responseRate = Math.round((items.filter((i) => i.response_type && i.response_type !== 'NO_RESPONSE').length / items.length) * 100);
            return (
              <div key={week}>
                <div className="flex items-center gap-3 mb-3">
                  <h2 className="font-medium text-gray-700">Week of {week}</h2>
                  <span className="text-xs text-gray-400">{items.length} prompts · {responseRate}% response rate</span>
                </div>
                <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        {['Clinic', 'Discipline', 'Sent', 'Responded', 'Status', ''].map((h) => (
                          <th key={h} className="text-left px-4 py-2.5 text-xs font-medium text-gray-500 uppercase tracking-wide">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {items.map((p) => (
                        <tr key={p.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 font-medium text-gray-900">{p.availability_object?.clinic?.name}</td>
                          <td className="px-4 py-3 text-gray-600">{p.availability_object?.discipline}</td>
                          <td className="px-4 py-3 text-gray-500">{daysAgo(p.sent_at)}</td>
                          <td className="px-4 py-3 text-gray-500">{p.responded_at ? daysAgo(p.responded_at) : '—'}</td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${RESPONSE_BADGE[p.response_type]}`}>
                              {p.response_type || 'Pending'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            {(!p.response_type || p.response_type === 'NO_RESPONSE') && (
                              <button onClick={() => handleResend(p.id)} disabled={resending === p.id}
                                className="text-blue-600 text-xs hover:underline disabled:opacity-50">
                                {resending === p.id ? 'Sending…' : 'Resend'}
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
          {Object.keys(byWeek).length === 0 && (
            <p className="text-gray-400 text-center py-8">No freshness prompts sent yet.</p>
          )}
        </div>
      )}
    </div>
  );
}
