import { Link } from 'react-router-dom';
import { useJobStore } from '../store/useJobStore';

export default function DashboardPage() {
  const jobs = useJobStore((state) => state.jobs);

  return (
    <div>
      <h1 className="text-2xl font-semibold text-slate-900">Dashboard</h1>
      <p className="mt-1 text-sm text-slate-500">Overview of your jobs.</p>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Total jobs" value={jobs.length} />
        <StatCard label="Active jobs" value={jobs.filter((j) => j.status === 'active').length} />
        <StatCard label="Leads" value={jobs.filter((j) => j.status === 'lead').length} />
      </div>

      <div className="mt-8">
        <Link
          to="/jobs/new"
          className="inline-block rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
        >
          + New Job
        </Link>
      </div>
    </div>
  );
}

function StatCard({ label, value }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <div className="text-sm text-slate-500">{label}</div>
      <div className="mt-1 text-2xl font-semibold text-slate-900">{value}</div>
    </div>
  );
}
