import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 px-4" role="main">
      <h1 className="text-4xl font-semibold text-slate-900 tracking-tight">404</h1>
      <p className="text-slate-600 mt-2">Page not found</p>
      <Link
        to="/"
        className="mt-6 btn-secondary"
      >
        Go to Dashboard
      </Link>
    </div>
  );
}
