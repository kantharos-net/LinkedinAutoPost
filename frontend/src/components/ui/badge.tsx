export function Badge({
  children,
  dot = false,
}: {
  children: React.ReactNode;
  dot?: boolean;
}) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-border-strong bg-blue-50 px-3 py-1 text-xs font-semibold text-primary">
      {dot && <span className="h-1.5 w-1.5 rounded-full bg-primary" />}
      {children}
    </span>
  );
}
