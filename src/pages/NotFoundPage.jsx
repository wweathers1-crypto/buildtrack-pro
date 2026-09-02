import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold text-slate-900">Page not found</h1>
      <Link to="/" className="mt-2 inline-block text-sm text-slate-900 underline">
        Back to dashboard
      </Link>
    </div>
  );
}
