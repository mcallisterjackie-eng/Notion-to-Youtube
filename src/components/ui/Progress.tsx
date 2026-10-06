/** Progress with the signature gradient fill. One per view counts as its gradient moment. */
export function Progress({
  value = 0,
  max = 100,
  label = "Progress",
  hideValue,
  className,
}: {
  value?: number;
  max?: number;
  label?: string;
  hideValue?: boolean;
  className?: string;
}) {
  const v = Math.max(0, Math.min(max, value));
  const pct = Math.round((v / max) * 100);
  return (
    <div className={["sdl-progress", className].filter(Boolean).join(" ")}>
      <div className="sdl-progress-head">
        <span>{label}</span>
        {hideValue ? null : <span className="sdl-progress-value">{pct}%</span>}
      </div>
      <div className="sdl-progress-track" role="progressbar" aria-valuemin={0} aria-valuemax={max} aria-valuenow={v} aria-label={label}>
        <div className="sdl-progress-fill" style={{ width: `${pct}%`, backgroundSize: `${pct > 0 ? 10000 / pct : 100}% 100%` }} />
      </div>
    </div>
  );
}
