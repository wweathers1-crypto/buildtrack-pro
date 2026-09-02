import { Link, useNavigate, useParams } from 'react-router-dom';
import { useJobStore } from '../../store/useJobStore';
import { isLienTrackingSupported } from '../../models/job';

export default function JobDetailPage() {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const job = useJobStore((state) => state.getJobById(jobId));
  const deleteJob = useJobStore((state) => state.deleteJob);

  if (!job) {
    return (
      <div>
        <p className="text-sm text-slate-500">Job not found.</p>
        <Link to="/jobs" className="text-sm text-slate-900 underline">
          Back to jobs
        </Link>
      </div>
    );
  }

  function handleDelete() {
    if (window.confirm('Delete this job? This cannot be undone.')) {
      deleteJob(job.id);
      navigate('/jobs');
    }
  }

  return (
    <div className="max-w-2xl">
      <Link to="/jobs" className="text-sm text-slate-500 hover:underline">
        ← Back to jobs
      </Link>
      <div className="mt-2 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-900">{job.name || 'Untitled job'}</h1>
        <button onClick={handleDelete} className="text-sm text-red-600 hover:underline">
          Delete
        </button>
      </div>

      <dl className="mt-6 space-y-4 rounded-lg border border-slate-200 bg-white p-4 text-sm">
        <Row label="Status" value={job.status.replace('_', ' ')} />
        <Row label="Client" value={job.clientName || '—'} />
        <Row
          label="Contract amount"
          value={job.contractAmount != null ? `$${job.contractAmount.toLocaleString()}` : '—'}
        />
        <Row
          label="Property address"
          value={
            [job.address.street, job.address.city, job.address.state, job.address.zip]
              .filter(Boolean)
              .join(', ') || '—'
          }
        />
        <Row label="Start date" value={job.startDate || '—'} />
      </dl>

      <div className="mt-6 rounded-lg border border-dashed border-slate-300 p-4 text-sm text-slate-500">
        {isLienTrackingSupported(job)
          ? "Get Paid: lien deadline tracking for this job's state is coming soon."
          : "Get Paid: lien deadline tracking isn't available for this job's state yet (SC and NC only)."}
      </div>
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex justify-between border-b border-slate-100 pb-2 last:border-0 last:pb-0">
      <dt className="text-slate-500">{label}</dt>
      <dd className="font-medium text-slate-900">{value}</dd>
    </div>
  );
}
