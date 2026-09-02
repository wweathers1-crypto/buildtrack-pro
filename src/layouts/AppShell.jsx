import { NavLink, Outlet } from 'react-router-dom';

const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', end: true },
  { to: '/jobs', label: 'Jobs' },
  { to: '/get-paid', label: 'Get Paid' },
];

function navLinkClasses({ isActive }) {
  return [
    'block rounded-md px-3 py-2 text-sm font-medium',
    isActive ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100',
  ].join(' ');
}

export default function AppShell() {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="flex">
        <aside className="hidden w-56 shrink-0 border-r border-slate-200 bg-white px-3 py-6 sm:block">
          <div className="mb-6 px-3 text-lg font-bold text-slate-900">
            BuildTrack Pro
          </div>
          <nav className="space-y-1">
            {NAV_ITEMS.map((item) => (
              <NavLink key={item.to} to={item.to} end={item.end} className={navLinkClasses}>
                {item.label}
              </NavLink>
            ))}
          </nav>
        </aside>
        <main className="min-w-0 flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
