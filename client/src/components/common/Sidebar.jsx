import { Link, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import CreateBoardModal from '../board/CreateBoardModal.jsx';
import api from '../../services/api.js';

export default function Sidebar() {
  const location = useLocation();
  const [boards, setBoards] = useState([]);
  const [createOpen, setCreateOpen] = useState(false);

  const isDashboard = location.pathname === '/dashboard';
  const isBoard = location.pathname.startsWith('/boards/');

  const fetchBoards = () => {
    api.get('/boards').then((res) => setBoards(res.data.boards || []));
  };

  useEffect(() => {
    fetchBoards();
  }, []);

  return (
    <>
      <aside className="hidden sm:flex w-60 flex-shrink-0 flex-col border-r border-slate-200/80 bg-white">
        <nav className="p-3 space-y-0.5">
          <Link
            to="/dashboard"
            className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors duration-150 ${
              isDashboard
                ? 'bg-slate-100 text-slate-900'
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-800'
            }`}
          >
            <svg className="w-5 h-5 text-slate-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6z" />
            </svg>
            Dashboard
          </Link>
          <button
            type="button"
            onClick={() => setCreateOpen(true)}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-800 transition-colors duration-150"
          >
            <svg className="w-5 h-5 text-slate-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Create board
          </button>
        </nav>
        <div className="flex-1 overflow-auto px-2 pb-4 min-h-0">
          <p className="px-3 py-2 text-2xs font-semibold text-slate-400 uppercase tracking-wider">
            Boards
          </p>
          <ul className="space-y-0.5">
            {boards.slice(0, 14).map((board) => (
              <li key={board._id}>
                <Link
                  to={`/boards/${board._id}`}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm truncate transition-colors duration-150 ${
                    isBoard && location.pathname === `/boards/${board._id}`
                      ? 'bg-slate-100 text-slate-900 font-medium'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-800'
                  }`}
                >
                  <span
                    className="w-3 h-3 rounded-md flex-shrink-0 shadow-inner-soft"
                    style={{ backgroundColor: board.backgroundColor || '#0f766e' }}
                  />
                  <span className="truncate">{board.title}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </aside>
      {createOpen && (
        <CreateBoardModal
          onClose={() => { setCreateOpen(false); fetchBoards(); }}
          onSubmit={(payload) => api.post('/boards', payload).then(() => { setCreateOpen(false); fetchBoards(); })}
        />
      )}
    </>
  );
}
