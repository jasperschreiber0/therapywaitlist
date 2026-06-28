import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createClinic } from '../../lib/adminApi';

const DISCIPLINES = ['OT', 'SPEECH', 'PSYCHOLOGY'];
const AGE_BANDS = ['0-3', '4-7', '8-12', '13-18'];

const emptyAo = () => ({ discipline: 'OT', intake_status: 'OPEN', age_bands_served: ['4-7', '8-12'], wait_time_band: 'TWO_FOUR_WEEKS', capacity_level: 'MEDIUM', monthly_referral_cap: null });

export default function NewClinic() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    clinic: { name: '', address: '', suburb: '', lat: '', lng: '', phone: '', website: '', ndis_registered: false, bulk_billing: false, private_health: false },
    admin: { name: '', email: '', phone: '' },
    availability: [emptyAo()],
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const setClinic = (k, v) => setForm((f) => ({ ...f, clinic: { ...f.clinic, [k]: v } }));
  const setAdmin = (k, v) => setForm((f) => ({ ...f, admin: { ...f.admin, [k]: v } }));
  const setAo = (i, k, v) => setForm((f) => {
    const availability = [...f.availability];
    availability[i] = { ...availability[i], [k]: v };
    return { ...f, availability };
  });
  const toggleBand = (i, band) => setForm((f) => {
    const availability = [...f.availability];
    const bands = availability[i].age_bands_served;
    availability[i] = { ...availability[i], age_bands_served: bands.includes(band) ? bands.filter((b) => b !== band) : [...bands, band] };
    return { ...f, availability };
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true); setError('');
    try {
      const payload = {
        clinic: { ...form.clinic, lat: parseFloat(form.clinic.lat), lng: parseFloat(form.clinic.lng) },
        admin: form.admin,
        availability: form.availability,
      };
      const clinic = await createClinic(payload);
      navigate(`/admin/clinics/${clinic.id}`);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create clinic');
      setSaving(false);
    }
  };

  const Field = ({ label, value, onChange, type = 'text', required = true }) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} required={required}
        className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
    </div>
  );

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate(-1)} className="text-blue-600 text-sm">← Back</button>
        <h1 className="text-xl font-semibold text-gray-900">Add new clinic</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h2 className="font-medium text-gray-700 mb-4">Clinic details</h2>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Clinic name" value={form.clinic.name} onChange={(v) => setClinic('name', v)} />
            <Field label="Phone" value={form.clinic.phone} onChange={(v) => setClinic('phone', v)} />
            <div className="col-span-2"><Field label="Address" value={form.clinic.address} onChange={(v) => setClinic('address', v)} /></div>
            <Field label="Suburb" value={form.clinic.suburb} onChange={(v) => setClinic('suburb', v)} />
            <Field label="Website" value={form.clinic.website} onChange={(v) => setClinic('website', v)} required={false} />
            <Field label="Latitude" value={form.clinic.lat} onChange={(v) => setClinic('lat', v)} type="number" />
            <Field label="Longitude" value={form.clinic.lng} onChange={(v) => setClinic('lng', v)} type="number" />
          </div>
          <div className="flex gap-4 mt-4">
            {[['ndis_registered', 'NDIS registered'], ['bulk_billing', 'Bulk billing'], ['private_health', 'Private health']].map(([k, l]) => (
              <label key={k} className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                <input type="checkbox" checked={form.clinic[k]} onChange={(e) => setClinic(k, e.target.checked)} className="rounded" />
                {l}
              </label>
            ))}
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h2 className="font-medium text-gray-700 mb-4">Primary contact (clinic admin)</h2>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Name" value={form.admin.name} onChange={(v) => setAdmin('name', v)} />
            <Field label="Phone" value={form.admin.phone} onChange={(v) => setAdmin('phone', v)} />
            <div className="col-span-2"><Field label="Email" value={form.admin.email} onChange={(v) => setAdmin('email', v)} type="email" /></div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-medium text-gray-700">Availability</h2>
            <button type="button" onClick={() => setForm((f) => ({ ...f, availability: [...f.availability, emptyAo()] }))}
              className="text-blue-600 text-sm">+ Add discipline</button>
          </div>
          <div className="space-y-4">
            {form.availability.map((ao, i) => (
              <div key={i} className="border border-gray-200 rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <select value={ao.discipline} onChange={(e) => setAo(i, 'discipline', e.target.value)}
                    className="border border-gray-300 rounded p-2 text-sm font-medium">
                    {DISCIPLINES.map((d) => <option key={d}>{d}</option>)}
                  </select>
                  {form.availability.length > 1 && (
                    <button type="button" onClick={() => setForm((f) => ({ ...f, availability: f.availability.filter((_, j) => j !== i) }))}
                      className="text-red-500 text-sm">Remove</button>
                  )}
                </div>
                <div className="grid grid-cols-3 gap-3 text-sm">
                  <div>
                    <label className="block text-gray-500 mb-1">Status</label>
                    <select value={ao.intake_status} onChange={(e) => setAo(i, 'intake_status', e.target.value)} className="w-full border border-gray-300 rounded p-2">
                      {['OPEN', 'LIMITED', 'CLOSED'].map((v) => <option key={v}>{v}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-gray-500 mb-1">Wait time</label>
                    <select value={ao.wait_time_band} onChange={(e) => setAo(i, 'wait_time_band', e.target.value)} className="w-full border border-gray-300 rounded p-2">
                      {['UNDER_1_WEEK', 'ONE_TWO_WEEKS', 'TWO_FOUR_WEEKS', 'FOUR_EIGHT_WEEKS', 'EIGHT_PLUS_WEEKS'].map((v) => <option key={v}>{v}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-gray-500 mb-1">Capacity</label>
                    <select value={ao.capacity_level} onChange={(e) => setAo(i, 'capacity_level', e.target.value)} className="w-full border border-gray-300 rounded p-2">
                      {['HIGH', 'MEDIUM', 'LOW'].map((v) => <option key={v}>{v}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-gray-500 text-sm mb-1">Age bands served</label>
                  <div className="flex gap-2">
                    {AGE_BANDS.map((b) => (
                      <button type="button" key={b} onClick={() => toggleBand(i, b)}
                        className={`px-3 py-1 rounded text-sm border transition ${ao.age_bands_served.includes(b) ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-300'}`}>
                        {b}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {error && <p className="text-red-600 text-sm">{error}</p>}
        <button type="submit" disabled={saving} className="w-full bg-gray-900 text-white py-3 rounded-lg font-medium disabled:opacity-50">
          {saving ? 'Creating…' : 'Create clinic'}
        </button>
      </form>
    </div>
  );
}
