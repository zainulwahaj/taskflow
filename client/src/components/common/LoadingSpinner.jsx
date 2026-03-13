export default function LoadingSpinner({ className = '', size = 'md' }) {
  const sizeClasses = {
    sm: 'h-5 w-5 border-2',
    md: 'h-8 w-8 border-2',
    lg: 'h-10 w-10 border-[3px]',
  };
  return (
    <div
      className={`inline-block animate-spin rounded-full border-slate-200 border-t-slate-600 ${sizeClasses[size]} ${className}`}
      role="status"
      aria-label="Loading"
    />
  );
}
