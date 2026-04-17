import { InputHTMLAttributes } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export default function Input({
  label,
  error,
  className = "",
  ...props
}: InputProps) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-xs font-medium text-text-secondary">{label}</label>
      )}
      <input
        className={`w-full rounded-lg border border-white/8 bg-surface px-4 py-2.5 text-sm text-text-primary placeholder:text-white/20 transition-colors duration-150 hover:border-white/15 focus:border-white/25 focus:outline-none ${className}`}
        {...props}
      />
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}
