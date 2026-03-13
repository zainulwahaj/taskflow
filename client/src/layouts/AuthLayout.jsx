export default function AuthLayout({ children }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-50 via-white to-slate-50 px-4 py-12 sm:py-16">
      <div className="w-full max-w-[400px]">{children}</div>
    </div>
  );
}
