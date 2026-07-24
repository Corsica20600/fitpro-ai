type LoadingSkeletonProps = {
  lines?: number;
  className?: string;
  "aria-label"?: string;
};

export function LoadingSkeleton({
  lines = 1,
  className = "",
  "aria-label": ariaLabel = "Chargement",
}: LoadingSkeletonProps) {
  return (
    <div className={`fit-loading-skeleton ${className}`.trim()} aria-label={ariaLabel} aria-busy="true">
      {Array.from({ length: Math.max(lines, 1) }).map((_, index) => (
        <span key={index} className="fit-loading-skeleton__line" />
      ))}
    </div>
  );
}
