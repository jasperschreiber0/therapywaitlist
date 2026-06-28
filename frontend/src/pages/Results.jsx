import React, { useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import ResultCard from '../components/ResultCard';
import ContactModal from '../components/ContactModal';

export default function Results() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const [contactTarget, setContactTarget] = useState(null);
  const [sort, setSort] = useState('best');

  if (!state?.results) return <div className="p-8 text-center"><Link to="/search" className="text-blue-600">← New search</Link></div>;

  const { results, waitlist_options = [], search_id, suburb } = state.results;
  const { interpretation } = state;

  const sorted = [...results].sort((a, b) => {
    if (sort === 'wait') {
      const order = ['UNDER_1_WEEK', 'ONE_TWO_WEEKS', 'TWO_FOUR_WEEKS', 'FOUR_EIGHT_WEEKS', 'EIGHT_PLUS_WEEKS'];
      return order.indexOf(a.wait_time_band) - order.indexOf(b.wait_time_band);
    }
    if (sort === 'distance') return a.distance_km - b.distance_km;
    return b.composite_score - a.composite_score;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="flex items-center gap-3 mb-4">
          <button onClick={() => navigate('/search')} className="text-blue-600 text-sm">← Back</button>
          <h1 className="font-semibold text-gray-900">
            {results.length} clinic{results.length !== 1 ? 's' : ''} available near {suburb}
          </h1>
        </div>

        {interpretation && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4 text-sm text-blue-800">
            Based on your description: <strong>{interpretation.likely_disciplines?.join(', ')}</strong> · urgency {interpretation.urgency_score}/10
          </div>
        )}

        <div className="flex gap-2 mb-4 overflow-x-auto">
          {[['best', 'Best match'], ['wait', 'Shortest wait'], ['distance', 'Nearest']].map(([val, label]) => (
            <button key={val} onClick={() => setSort(val)}
              className={`px-3 py-1.5 rounded-full text-sm border whitespace-nowrap transition ${sort === val ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-600 border-gray-300'}`}>
              {label}
            </button>
          ))}
        </div>

        {sorted.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <p className="font-medium mb-2">No open clinics found</p>
            <p className="text-sm">Try expanding your search radius or join waitlists below.</p>
          </div>
        )}

        <div className="space-y-3">
          {sorted.map((r, i) => (
            <ResultCard key={i} result={r} onContact={setContactTarget}
              onWaitlist={(r) => navigate('/waitlist/join', { state: { result: r } })} />
          ))}
        </div>

        {waitlist_options.length > 0 && (
          <div className="mt-8">
            <h2 className="font-semibold text-gray-700 mb-3 text-sm uppercase tracking-wide">Clinics currently full — join waitlist</h2>
            <div className="space-y-3">
              {waitlist_options.map((r, i) => (
                <ResultCard key={i} result={r} onContact={setContactTarget}
                  onWaitlist={(r) => navigate('/waitlist/join', { state: { result: r } })} />
              ))}
            </div>
          </div>
        )}
      </div>

      {contactTarget && (
        <ContactModal result={contactTarget} searchId={search_id} onClose={() => setContactTarget(null)} />
      )}
    </div>
  );
}
