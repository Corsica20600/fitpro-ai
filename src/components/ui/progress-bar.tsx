type ProgressBarProps = {
  value: number;
  max?: number;
  label?: string;
  valueLabel?: string;
  className?: string;
};

function getProgressRatio(value: number, max: number) {
  if (max <= 0) return 0;
  return Math.min(Math.max(value / max, 0), 1);
}

export function ProgressBar({ value, max = 100, label, valueLabel, className = "" }: ProgressBarProps) {
  const ratio = getProgressRatio(value, max);
  const percent = Math.round(ratio * 100);

  return (
    <div
      className={`fit-progress-bar ${className}`.trim()}
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={Math.min(Math.max(value, 0), max)}
    >
      {(label || valueLabel) ? (
        <div className="fit-progress-bar__meta">
          {label ? <span>{label}</span> : null}
          {valueLabel ? <strong>{valueLabel}</strong> : null}
        </div>
      ) : null}
      <span className="fit-progress-bar__track">
        <span className="fit-progress-bar__fill" style={{ width: `${percent}%` }} />
      </span>
    </div>
  );
}
