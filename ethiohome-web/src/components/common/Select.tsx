import React from 'react';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: { label: string; value: string | number }[];
  error?: string;
}

export const Select: React.FC<SelectProps> = ({ label, options, error, className, ...props }) => {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-semibold text-text mb-1.5">
          {label}
        </label>
      )}
      <select
        className={`
          w-full px-4 py-2.5 bg-surface border rounded-xl outline-none appearance-none transition-all
          ${error ? 'border-error' : 'border-border focus:border-primary'}
          ${className}
        `}
        {...props}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && <p className="mt-1 text-sm text-error">{error}</p>}
    </div>
  );
};
