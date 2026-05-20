import React from 'react';
interface InputProps extends
  React.InputHTMLAttributes<HTMLInputElement | HTMLTextAreaElement> {
  label: string;
  error?: string;
  multiline?: boolean;
  rows?: number;
}
export function Input({
  label,
  error,
  multiline = false,
  className = '',
  id,
  ...props
}: InputProps) {
  const inputId = id || label.toLowerCase().replace(/\s+/g, '-');
  const baseStyles =
  'w-full px-4 py-3 rounded-xl border border-gray-300 bg-gray-50 text-gray-900 placeholder-gray-500 shadow-sm focus:bg-white transition-colors focus:outline-none focus:ring-2 focus:ring-ureport-blue focus:border-transparent';
  const errorStyles = error ?
  'border-red-500 focus:ring-red-500' :
  'border-gray-200';
  return (
    <div className={`flex flex-col space-y-1.5 ${className}`}>
      <label
        htmlFor={inputId}
        className="text-sm font-semibold text-ureport-dark">
        
        {label}
      </label>

      {multiline ?
      <textarea
        id={inputId}
        className={`${baseStyles} ${errorStyles} resize-none`}
        {...props as React.TextareaHTMLAttributes<HTMLTextAreaElement>} /> :


      <input
        id={inputId}
        className={`${baseStyles} ${errorStyles}`}
        {...props as React.InputHTMLAttributes<HTMLInputElement>} />

      }

      {error && <span className="text-sm text-red-500 mt-1">{error}</span>}
    </div>);

}