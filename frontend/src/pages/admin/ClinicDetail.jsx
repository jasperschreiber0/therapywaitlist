import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getClinic, updateAvailability } from '../../lib/adminApi';

const WAIT_LABELS = { UNDER_1_WEEK: '<1 wk', ONE_TWO_WEEKS: '1–2 wks', TWO_FOUR_WEEKS: '2–4 wks', FOUR_EIGHT_WEEKS: '4–8 wks', EIGHT_PLUS_WEEKS: '8+ wks' };
const CONF_COLOR = (s) => s > 0.7 ? 'bg-green-100 text-green-700' : s >= 0.4 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700';

export default function ClinicDetail() {
  const { id } = useParams();
  const [clinic, setClinic] = useState(null);
  const [editing, setEditing] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => { getClinic(id).then(setClinic); }, [id]);

  const startEdit = (ao) => {
    setEditing(ao.id);
    setEditForm({ intake_status: ao.intake_status, wait_time_band: ao.wait_time_band, capacity_level: ao.capacity_level, confidence_score: ao.confidence_score, monthly_referral_cap: ao.monthly_referral_cap || '' });
  };

  const saveEdit = async () => {
    setSaving(true);
    try {
      await updateAvailability(editing, {
        ...editForm,
        confidence_score: parseFloat(editForm.confidence_score),
        monthly_referral_cap: editForm.monthly_referral_cap ? parseInt(editForm.monthly_referral_cap) : null,
      });
      const updated = await getClinic(id);
      setClinic(updated);
      setEditing(null);
    } finally {
      setSaving(false);
    }
  };

  if (!clinic) return <div className="text-gray-400 py-12 text-center">Loading…</div>;

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link to="/admin/clinics" className="text-blue-600 text-sm">← Clinics</Link>
        <h1 className="text-xl font-semibold text-gray-900">{clinic.name}</h1>
      </div>

      <div className="grid grid-cols-2 gap-6 mb-8">
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <h2 className="font-medium text-gray-700 mb-3 text-sm">Clinic details</h2>
          <div className="space-y-2 text-sm">
            {[['Address', clinic.address], ['Suburb', clinic.suburb], ['Phone', clinic.phone], ['Website', clinic.website || '—']].map(([k, v]) => (
              <div key={k} className="flex gap-3"><span className="w-20 text-gray-500">{k}</span><span className="text-gray-900">{v}</span></div>
            ))}
            <div className="flex gap-3">
              <span className="w-20 text-gray-500">Services</span>
              <span className="text-gray-900">
                {[clinic.ndis_registered && 'NDIS', clinic.bulk_billing && 'Bulk billing', clinic.private_health && 'Private health'].filter(Boolean).join(', ') || '—'}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <h2 className="font-medium text-gray-700 mb-3 text-sm">Admins</h2>
          <div className="space-y-2">
            {clinic.admins?.map((a) => (
              <div key={a.id} className="text-sm">
                <p className="font-medium text-gray-900">{a.name} {a.is_primary_contact && <span className="text-xs text-blue-600">(primary)</span>}</p>
                <p className="text-gray-500">{a.email} · {a.phone}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <h2 className="font-medium text-gray-700 mb-3">Availability</h2>
      <div className="space-y-3">
        {clinic.availability?.map((ao) => (
          <div key={ao.id} className="bg-white border border-gray-200 rounded-xl p-5">
            {editing === ao.id ? (
              <div className="space-y-3">
                <div className="grid grid-cols-4 gap-3 text-sm">
                  <div>
                    <label className="block text-gray-500 mb-1">Status</label>
                    <select value={editForm.intake_status} onChange={(e) => setEditForm((f) => ({ ...f, intake_status: e.target.value }))}
                      className="w-full border border-gray-300 rounded p-2">
                      {['OPEN', 'LIMITED', 'CLOSED'].map((v) => <option key={v}>{v}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-gray-500 mb-1">Wait time</label>
                    <select value={editForm.wait_time_band} onChange={(e) => setEditForm((f) => ({ ...f, wait_time_band: e.target.value }))}
                      className="w-full border border-gray-300 rounded p-2">
                      {['UNDER_1_WEEK', 'ONE_TWO_WEEKS', 'TWO_FOUR_WEEKS', 'FOUR_EIGHT_WEEKS', 'EIGHT_PLUS_WEEKS'].map((v) => <option key={v}>{v}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-gray-500 mb-1">Capacity</label>
                    <select value={editForm.capacity_level} onChange={(e) => setEditForm((f) => ({ ...f, capacity_level: e.target.value }))}
                      className="w-full border border-gray-300 rounded p-2">
                      {['HIGH', 'MEDIUM', 'LOW'].map((v) => <option key={v}>{v}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-gray-500 mb-1">Confidence</label>
                    <input type="number" min="0" max="1" step="0.1" value={editForm.confidence_score}
                      onChange={(e) => setEditForm((f) => ({ ...f, confidence_score: e.target.value }))}
                      className="w-full border border-gray-300 rounded p-2" />
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={saveEdit} disabled={saving} className="bg-gray-900 text-white px-4 py-2 rounded-lg text-sm">
                    {saving ? 'Saving…' : 'Save'}
                  </button>
                  <button onClick={() => setEditing(null)} className="border border-gray-300 text-gray-600 px-4 py-2 rounded-lg text-sm">Cancel</button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <span className="font-medium text-gray-900">{ao.discipline}</span>
                  <span className="text-sm text-gray-600">{ao.intake_status} · {WAIT_LABELS[ao.wait_time_band]} · {ao.capacity_level}</span>
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${CONF_COLOR(ao.confidence_score)}`}>
                    {Math.round(ao.confidence_score * 100)}%
                  </span>
                  <span className="text-xs text-gray-400">Updated by {ao.updated_by}</span>
                </div>
                <button onClick={() => startEdit(ao)} className="text-blue-600 text-sm">Edit</button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
