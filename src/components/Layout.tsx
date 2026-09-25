import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const NAV = [
  { to: '/', label: 'Home', end: true },
  { to: '/prospects', label: 'Prospects' },
  { to: '/pipeline', label: 'Pipeline' },
  { to: '/sweeps', label: 'Sweeps' },
  { to: '/settings', label: 'Settings' },
]

export default function Layout() {
  const { profile, isAdmin, signOut } = useAuth()

  return (
    <div className="min-h-full flex flex-col md:flex-row">
      <aside className="md:w-56 shrink-0 border-b md:border-b-0 md:border-r border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950">
        <div className="flex items-center gap-2 px-4 py-4">
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-brand-600 text-white text-sm font-bold">
            V
          </span>
          <div>
            <div className="font-semibold leading-tight">Verdek</div>
            <div className="text-xs text-neutral-500 leading-tight">Pitchly</div>
          </div>
        </div>
        <nav className="flex md:flex-col gap-1 px-2 pb-3 overflow-x-auto md:overflow-visible">
          {NAV.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              end={n.end}
              className={({ isActive }) =>
                `whitespace-nowrap rounded-md px-3 py-2 text-sm font-medium ${
                  isActive
                    ? 'bg-brand-100 text-brand-800 dark:bg-brand-900/40 dark:text-brand-200'
                    : 'text-neutral-600 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-900'
                }`
              }
            >
              {n.label}
            </NavLink>
          ))}
          {isAdmin && (
            <NavLink
              to="/admin/users"
              className={({ isActive }) =>
                `whitespace-nowrap rounded-md px-3 py-2 text-sm font-medium ${
                  isActive
                    ? 'bg-brand-100 text-brand-800 dark:bg-brand-900/40 dark:text-brand-200'
                    : 'text-neutral-600 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-900'
                }`
              }
            >
              Admin
            </NavLink>
          )}
        </nav>
        <div className="hidden md:block px-4 py-3 border-t border-neutral-200 dark:border-neutral-800 text-xs text-neutral-500">
          <div className="truncate">{profile?.email}</div>
          <div className="mt-0.5">{profile?.role === 'admin' ? 'Administrator' : 'Member'}</div>
          <button onClick={() => signOut()} className="mt-2 text-brand-600 hover:underline">
            Sign out
          </button>
        </div>
      </aside>
      <main className="flex-1 min-w-0 p-4 md:p-8">
        <Outlet />
      </main>
    </div>
  )
}
