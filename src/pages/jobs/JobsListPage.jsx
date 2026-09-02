import { Link } from 'react-router-dom';
import { useJobStore } from '../../store/useJobStore';
import { isLienTrackingSupported } from '../../models/job';

const STATUS_STYLES = {
  lead: 'bg-slate-100 text-slate-700',
  active: 'bg-emerald-100 text-emerald-700',
  on_hold: 'bg-amber-100 text-amber-700',
  complete: 'bg-blue-100 text-blue-700',
  cancelled: 'bg-red-100 text-red-700',
};

export default function JobsListPage() {
  const jobs = useJobStore((state) => state.jobs);

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-900">Jobs</h1>
        <Link
          to="/jobs/new"
          className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
        >
          + New Job
        </Link>
      </div>

      {jobs.length === 0 ? (
        <p className="mt-6 text-sm text-slate-500">
          No jobs yet. Create your first one to get started.
        </p>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-lg border border-slate-200 bg-white">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Job</th>
                <th className="px-4 py-3">Client</th>
                <th className="px-4 py-3">State</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Contract amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {jobs.map((job) => (
                <tr key={job.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <Link to={`/jobs/${job.id}`} className="font-medium text-slate-900 hover:underline">
                      {job.name || 'Untitled job'}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{job.clientName || '—'}</td>
                  <td className="px-4 py-3 text-slate-600">
                    {job.address.state || '—'}
                    {job.address.state && !isLienTrackingSupported(job) && (
                      <span className="ml-1 text-xs text-amber-600">(lien tracking not yet supported)</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                        STATUS_STYLES[job.status] ?? 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {job.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {job.contractAmount != null ? `$${job.contractAmount.toLocaleString()}` : '—'}
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
