import React from 'react';

const WAIT_LABELS = {
  UNDER_1_WEEK: 'Under 1 week',
  ONE_TWO_WEEKS: '1–2 weeks',
  TWO_FOUR_WEEKS: '2–4 weeks',
  FOUR_EIGHT_WEEKS: '4–8 weeks',
  EIGHT_PLUS_WEEKS: '8+ weeks',
};

const STATUS_STYLES = {
  OPEN: 'bg-green-100 text-green-800',
  LIMITED: 'bg-amber-100 text-amber-800',
  CLOSED: 'bg-gray-100 text-gray-600',
};

const STATUS_LABELS = { OPEN: 'Open', LIMITED: 'Limited', CLOSED: 'Closed' };

function daysAgo(date) {
  const d = Math.floor((Date.now() - new Date(date)) / (1000 * 60 * 60 * 24));
  if (d === 0) return 'Today';
  if (d === 1) return '1 day ago';
  return `${d} days ago`;
}

export default function ResultCard({ result, onContact, onWaitlist }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="font-semibold text-gray-900">{result.clinic_name}</h3>
          <p className="text-sm text-gray-500">{result.suburb} · {result.distance_km}km away</p>
        </div>
        <span className={`text-xs font-medium px-2 py-1 rounded-full ${STATUS_STYLES[result.intake_status]}`}>
          {STATUS_LABELS[result.intake_status]}
        </span>
      </div>

      <div className="flex flex-wrap gap-3 text-sm text-gray-600 mb-4">
        <span><span className="font-medium">Discipline:</span> {result.discipline}</span>
        <span><span className="font-medium">Wait:</span> {WAIT_LABELS[result.wait_time_band]}</span>
        {result.ndis_registered && <span className="bg-purple-100 text-purple-700 px-2 py-0.5 rounded text-xs">NDIS</span>}
        <span className="text-gray-400 text-xs">Updated {daysAgo(result.last_updated)}</span>
      </div>

      <div className="flex gap-2">
        {result.intake_status !== 'CLOSED' && (
          <button onClick={() => onContact(result)}
            className="flex-1 bg-blue-600 text-white text-sm py-2 rounded-lg font-medium">
            Contact clinic
          </button>
        )}
        {result.intake_status === 'CLOSED' && onWaitlist && (
          <button onClick={() => onWaitlist(result)}
            className="flex-1 border border-gray-300 text-gray-700 text-sm py-2 rounded-lg font-medium">
            Join waitlist
          </button>
        )}
      </div>
    </div>
  );
}
