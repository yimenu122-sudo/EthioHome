import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, className, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-semibold text-text mb-1.5">
            {label}
          </label>
        )}
        <div className="relative">
          <input
            ref={ref}
            className={`
              w-full px-4 py-2.5 bg-surface border rounded-xl outline-none transition-all
              ${error ? 'border-error' : 'border-border focus:border-primary'}
              disabled:bg-background disabled:text-text-muted
              ${className}
            `}
            {...props}
          />
        </div>
        {error ? (
          <p className="mt-1 text-sm text-error">{error}</p>
        ) : helperText ? (
          <p className="mt-1 text-sm text-text-muted">{helperText}</p>
        ) : null}
      </div>
    );
  }
);

Input.displayName = 'Input';
