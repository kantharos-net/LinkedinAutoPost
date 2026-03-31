import { HTMLAttributes } from "react";

export function Card({ className = "", children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`rounded-card border border-border bg-surface p-6 shadow-card ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-1.5 text-xs font-bold uppercase tracking-widest text-primary">{children}</p>
  );
}

export function CardHint({ children }: { children: React.ReactNode }) {
  return <p className="mb-3 text-sm text-text-secondary">{children}</p>;
}
