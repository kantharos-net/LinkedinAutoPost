export function Spinner({ size = 20 }: { size?: number }) {
  return (
    <span
      className="inline-block animate-spin rounded-full border-2 border-primary border-t-transparent"
      style={{ width: size, height: size }}
      aria-label="Loading"
    />
  );
}
