import React from 'react';
import { logSelect } from '../api';

export default function ContactModal({ result, searchId, onClose }) {
  const handleOpen = () => {
    if (searchId) logSelect(searchId, result.clinic_id).catch(() => {});
  };

  React.useEffect(() => { handleOpen(); }, []);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-sm p-6">
        <div className="flex justify-between items-start mb-4">
          <h2 className="font-semibold text-gray-900">{result.clinic_name}</h2>
          <button onClick={onClose} className="text-gray-400 text-xl leading-none">&times;</button>
        </div>

        <p className="text-sm text-gray-600 mb-4">{result.suburb}</p>

        <div className="space-y-3 mb-5">
          {result.phone && (
            <div className="flex items-center gap-3">
              <span className="text-gray-500 text-sm flex-1">{result.phone}</span>
              <button onClick={() => navigator.clipboard?.writeText(result.phone)}
                className="text-blue-600 text-sm font-medium">Copy</button>
            </div>
          )}
          {result.website && (
            <a href={result.website} target="_blank" rel="noopener noreferrer"
              className="block text-blue-600 text-sm underline">{result.website}</a>
          )}
        </div>

        <p className="text-xs text-gray-400">
          TherapyWaitlist shows availability at the time of last update. Confirm availability directly with the clinic.
        </p>
      </div>
    </div>
  );
}
