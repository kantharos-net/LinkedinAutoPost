import { TextareaHTMLAttributes, forwardRef } from "react";

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ error, className = "", ...props }, ref) => {
    return (
      <div className="w-full">
        <textarea
          ref={ref}
          className={`w-full rounded-lg border bg-slate-50 px-3.5 py-3 text-sm text-text-primary placeholder-text-secondary/60 transition-colors duration-150 focus:border-primary focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 resize-y min-h-[96px] ${
            error ? "border-red-400" : "border-muted"
          } ${className}`}
          {...props}
        />
        {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
      </div>
    );
  }
);

Textarea.displayName = "Textarea";
