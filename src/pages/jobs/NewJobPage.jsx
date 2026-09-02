import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useJobStore } from '../../store/useJobStore';
import { JOB_STATUSES } from '../../models/job';

// TODO: expand as the Get Paid module adds lien-deadline support for more states
const US_STATES = ['SC', 'NC'];

const inputClass =
  'block w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500';

export default function NewJobPage() {
  const addJob = useJobStore((state) => state.addJob);
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '',
    clientName: '',
    clientEmail: '',
    clientPhone: '',
    street: '',
    city: '',
    state: '',
    zip: '',
    status: 'lead',
    contractAmount: '',
    startDate: '',
  });

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    const job = addJob({
      name: form.name,
      clientName: form.clientName,
      clientEmail: form.clientEmail,
      clientPhone: form.clientPhone,
      address: { street: form.street, city: form.city, state: form.state, zip: form.zip },
      status: form.status,
      contractAmount: form.contractAmount ? Number(form.contractAmount) : null,
      startDate: form.startDate || null,
    });
    navigate(`/jobs/${job.id}`);
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-semibold text-slate-900">New Job</h1>
      <form onSubmit={handleSubmit} className="mt-6 space-y-6">
        <Section title="Job">
          <Field label="Job name">
            <input className={inputClass} value={form.name} onChange={(e) => update('name', e.target.value)} required />
          </Field>
          <Field label="Status">
            <select className={inputClass} value={form.status} onChange={(e) => update('status', e.target.value)}>
              {JOB_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s.replace('_', ' ')}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Contract amount">
            <input
              type="number"
              className={inputClass}
              value={form.contractAmount}
              onChange={(e) => update('contractAmount', e.target.value)}
            />
          </Field>
          <Field label="Start date">
            <input type="date" className={inputClass} value={form.startDate} onChange={(e) => update('startDate', e.target.value)} />
          </Field>
        </Section>

        <Section title="Client">
          <Field label="Client name">
            <input className={inputClass} value={form.clientName} onChange={(e) => update('clientName', e.target.value)} />
          </Field>
          <Field label="Client email">
            <input type="email" className={inputClass} value={form.clientEmail} onChange={(e) => update('clientEmail', e.target.value)} />
          </Field>
          <Field label="Client phone">
            <input className={inputClass} value={form.clientPhone} onChange={(e) => update('clientPhone', e.target.value)} />
          </Field>
        </Section>

        <Section title="Property address">
          <Field label="Street">
            <input className={inputClass} value={form.street} onChange={(e) => update('street', e.target.value)} />
          </Field>
          <Field label="City">
            <input className={inputClass} value={form.city} onChange={(e) => update('city', e.target.value)} />
          </Field>
          <Field label="State">
            <select className={inputClass} value={form.state} onChange={(e) => update('state', e.target.value)}>
              <option value="">Select…</option>
              {US_STATES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-slate-500">
              Property state — this drives lien deadline tracking. Only SC and NC are supported today.
            </p>
          </Field>
          <Field label="ZIP">
            <input className={inputClass} value={form.zip} onChange={(e) => update('zip', e.target.value)} />
          </Field>
        </Section>

        <button
          type="submit"
          className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
        >
          Create job
        </button>
      </form>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <h2 className="mb-4 text-sm font-semibold text-slate-900">{title}</h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">{children}</div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-slate-700">{label}</span>
      {children}
    </label>
  );
}
