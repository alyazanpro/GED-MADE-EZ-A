/** Brand wordmark: GED (Oman red) · MADE (white) · EZ (Oman green) */
export function BrandName({ className = "" }: { className?: string }) {
  return (
    <span className={className}>
      <span className="lp-accent-red">GED</span>
      <span> MADE </span>
      <span className="lp-accent">EZ</span>
    </span>
  );
}
