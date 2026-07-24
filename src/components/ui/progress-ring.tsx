type ProgressRingProps = {
  value: number;
  max?: number;
  size?: number;
  strokeWidth?: number;
  label?: string;
  valueLabel?: string;
  ariaLabel?: string;
  className?: string;
};

function clampProgress(value: number, max: number) {
  if (max <= 0) return 0;
  return Math.min(Math.max(value, 0), max);
}

export function ProgressRing({
  value,
  max = 100,
  size = 112,
  strokeWidth = 10,
  label,
  valueLabel,
  ariaLabel,
  className = "",
}: ProgressRingProps) {
  const safeValue = clampProgress(value, max);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = max > 0 ? safeValue / max : 0;
  const dashOffset = circumference * (1 - progress);
  const center = size / 2;

  return (
    <figure
      className={`fit-progress-ring ${className}`.trim()}
      role="img"
      aria-label={ariaLabel ?? `${label ?? "Progression"} ${Math.round(progress * 100)}%`}
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
        <circle
          className="fit-progress-ring__track"
          cx={center}
          cy={center}
          r={radius}
          strokeWidth={strokeWidth}
        />
        <circle
          className="fit-progress-ring__value"
          cx={center}
          cy={center}
          r={radius}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
        />
      </svg>
      <figcaption className="fit-progress-ring__label">
        {valueLabel ? <strong>{valueLabel}</strong> : null}
        {label ? <span>{label}</span> : null}
      </figcaption>
    </figure>
  );
}
