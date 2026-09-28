"use client";

import { InputHTMLAttributes, TextareaHTMLAttributes, forwardRef } from "react";

interface FieldWrapperProps {
  label: string;
  htmlFor: string;
  error?: string;
  hint?: string;
  required?: boolean;
}

export function FieldWrapper({
  label,
  htmlFor,
  error,
  hint,
  required,
  children,
}: FieldWrapperProps & { children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={htmlFor} className="tech-label flex items-center gap-1">
        {label}
        {required && <span className="text-[var(--color-danger)]">*</span>}
      </label>
      {children}
      {hint && !error && <p className="font-mono-tech text-xs text-[#5c6b85]">{hint}</p>}
      {error && (
        <p className="font-mono-tech text-xs text-[var(--color-danger)]" role="alert">
          ⚠ {error}
        </p>
      )}
    </div>
  );
}

type InputProps = InputHTMLAttributes<HTMLInputElement> &
  FieldWrapperProps & { name: string };

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, htmlFor, error, hint, required, className = "", ...rest },
  ref
) {
  return (
    <FieldWrapper label={label} htmlFor={htmlFor} error={error} hint={hint} required={required}>
      <input
        ref={ref}
        id={htmlFor}
        className={`field-input ${error ? "field-error" : ""} ${className}`}
        aria-invalid={!!error}
        {...rest}
      />
    </FieldWrapper>
  );
});

type TextAreaProps = TextareaHTMLAttributes<HTMLTextAreaElement> &
  FieldWrapperProps & { name: string };

export const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(function TextArea(
  { label, htmlFor, error, hint, required, className = "", ...rest },
  ref
) {
  return (
    <FieldWrapper label={label} htmlFor={htmlFor} error={error} hint={hint} required={required}>
      <textarea
        ref={ref}
        id={htmlFor}
        className={`field-input resize-y ${error ? "field-error" : ""} ${className}`}
        aria-invalid={!!error}
        {...rest}
      />
    </FieldWrapper>
  );
});
