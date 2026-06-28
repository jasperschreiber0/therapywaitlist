import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { interpretReferral, searchClinics } from '../api';

const DISCIPLINES = ['OT', 'SPEECH', 'PSYCHOLOGY'];
const DISCIPLINE_LABELS = { OT: 'Occupational Therapy', SPEECH: 'Speech Pathology', PSYCHOLOGY: 'Psychology' };

export default function Search() {
  const navigate = useNavigate();
  const [mode, setMode] = useState('ai');
  const [text, setText] = useState('');
  const [suburb, setSuburb] = useState('');
  const [radius, setRadius] = useState(10);
  const [disciplines, setDisciplines] = useState([]);
  const [childAge, setChildAge] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [interpretation, setInterpretation] = useState(null);

  const toggleDiscipline = (d) =>
    setDisciplines((prev) => prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]);

  const handleAiSearch = async () => {
    if (!text.trim() || !suburb.trim()) { setError('Please fill in all fields'); return; }
    setError(''); setLoading(true);
    try {
      const interp = await interpretReferral(text);
      setInterpretation(interp);
    } catch {
      setError('Unable to interpret referral. Try the manual search.');
    } finally {
      setLoading(false);
    }
  };

  const runSearch = async (overrides = {}) => {
    setLoading(true); setError('');
    try {
      const params = mode === 'ai' && interpretation
        ? { disciplines: interpretation.likely_disciplines.map((d) => d.toUpperCase()), child_age: parseInt(childAge) || 7, urgency_score: interpretation.urgency_score, suburb, radius_km: radius }
        : { disciplines, child_age: parseInt(childAge), urgency_score: 0, suburb, radius_km: radius };
      const data = await searchClinics({ ...params, ...overrides, include_waitlist: true });
      navigate('/search/results', { state: { results: data, suburb, disciplines: params.disciplines, interpretation } });
    } catch (err) {
      setError(err.response?.data?.error || 'Search failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">TherapyWaitlist</h1>
        <p className="text-gray-500 mb-6">Find paediatric therapy availability in Sydney's Eastern Suburbs</p>

        <div className="flex gap-2 mb-6">
          <button onClick={() => setMode('ai')} className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium border transition ${mode === 'ai' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-300'}`}>
            Describe the child
          </button>
          <button onClick={() => setMode('direct')} className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium border transition ${mode === 'direct' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-300'}`}>
            I know what I need
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
          {mode === 'ai' ? (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Describe what you're looking for</label>
                <textarea
                  value={text} onChange={(e) => setText(e.target.value)}
                  placeholder="e.g. 7-year-old boy, handwriting difficulties, school concerns, can start ASAP"
                  className="w-full border border-gray-300 rounded-lg p-3 text-sm resize-none h-28 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  maxLength={2000}
                />
                <p className="text-xs text-gray-400 mt-1">{text.length}/2000</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Child's age</label>
                <input type="number" min="0" max="18" value={childAge} onChange={(e) => setChildAge(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Age in years" />
              </div>
            </>
          ) : (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Discipline</label>
                <div className="flex gap-2 flex-wrap">
                  {DISCIPLINES.map((d) => (
                    <button key={d} onClick={() => toggleDiscipline(d)}
                      className={`px-4 py-2 rounded-lg text-sm border transition ${disciplines.includes(d) ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-300'}`}>
                      {DISCIPLINE_LABELS[d]}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Child's age</label>
                <input type="number" min="0" max="18" value={childAge} onChange={(e) => setChildAge(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Age in years" />
              </div>
            </>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Suburb</label>
            <input value={suburb} onChange={(e) => setSuburb(e.target.value)}
              className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g. Bondi Junction" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Radius: {radius}km</label>
            <input type="range" min="2" max="25" value={radius} onChange={(e) => setRadius(Number(e.target.value))}
              className="w-full" />
          </div>

          {error && <p className="text-red-600 text-sm">{error}</p>}

          {interpretation && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm space-y-2">
              <p className="font-medium text-blue-800">AI interpretation</p>
              <p className="text-blue-700">Likely disciplines: <strong>{interpretation.likely_disciplines.join(', ')}</strong></p>
              <p className="text-blue-700">Urgency: <strong>{interpretation.urgency_score}/10</strong> — {interpretation.urgency_reasoning}</p>
              {interpretation.safeguarding_flag && (
                <p className="text-red-700 font-semibold">⚠ Safeguarding concern flagged</p>
              )}
              <button onClick={() => runSearch()} className="mt-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium">
                Search with these parameters
              </button>
            </div>
          )}

          {!interpretation && (
            <button
              onClick={mode === 'ai' ? handleAiSearch : () => runSearch()}
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium disabled:opacity-50">
              {loading ? 'Searching…' : 'Find available clinics'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
