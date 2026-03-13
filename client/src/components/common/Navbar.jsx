import { Link } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth.js';

export default function Navbar() {
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="h-14 flex-shrink-0 flex items-center justify-between px-4 sm:px-6 bg-white border-b border-slate-200/80 shadow-soft">
      <Link
        to="/dashboard"
        className="text-lg font-semibold text-slate-900 hover:text-slate-700 transition-colors"
      >
        TaskFlow
      </Link>
      <div className="relative">
        <button
          type="button"
          onClick={() => setMenuOpen((v) => !v)}
          className="flex items-center gap-2 px-2.5 py-2 rounded-xl text-slate-700 hover:bg-slate-50 transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2"
          aria-expanded={menuOpen}
          aria-haspopup="true"
          aria-label="User menu"
        >
          {user?.avatarUrl ? (
            <img src={user.avatarUrl} alt="" className="w-8 h-8 rounded-lg object-cover" />
          ) : (
            <span className="w-8 h-8 rounded-lg bg-slate-200 flex items-center justify-center text-sm font-medium text-slate-600">
              {(user?.fullName || user?.email || 'U').charAt(0).toUpperCase()}
            </span>
          )}
          <span className="hidden sm:inline text-sm text-slate-700 max-w-[140px] truncate">
            {user?.fullName || user?.email}
          </span>
          <svg className="w-4 h-4 text-slate-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20" aria-hidden>
            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
        {menuOpen && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} aria-hidden />
            <div
              className="absolute right-0 top-full mt-1.5 z-20 w-56 rounded-xl bg-white shadow-soft-lg border border-slate-100 py-1.5"
              role="menu"
            >
              <div className="px-4 py-3 border-b border-slate-100">
                <p className="text-sm font-medium text-slate-900 truncate">{user?.fullName}</p>
                <p className="text-xs text-slate-500 truncate mt-0.5">{user?.email}</p>
              </div>
              <Link
                to="/dashboard"
                className="block px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                onClick={() => setMenuOpen(false)}
                role="menuitem"
              >
                Dashboard
              </Link>
              <button
                type="button"
                className="w-full px-4 py-2.5 text-left text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                onClick={() => { setMenuOpen(false); logout(); }}
                role="menuitem"
              >
                Log out
              </button>
            </div>
          </>
        )}
      </div>
    </header>
  );
}
