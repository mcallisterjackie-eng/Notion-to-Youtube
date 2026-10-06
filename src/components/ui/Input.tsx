import { useId, type ComponentProps } from "react";

/** A labelled single-line text field. Placeholders show an example, never the label. */
export function Input({
  label,
  hint,
  className,
  id,
  ...rest
}: { label?: string; hint?: string } & ComponentProps<"input">) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const hintId = `${inputId}-hint`;
  return (
    <div className={["sdl-field", className].filter(Boolean).join(" ")}>
      {label ? (
        <label className="sdl-field-label" htmlFor={inputId}>
          {label}
        </label>
      ) : null}
      <input type="text" {...rest} id={inputId} className="sdl-input" aria-describedby={hint ? hintId : undefined} />
      {hint ? (
        <span className="sdl-field-hint" id={hintId}>
          {hint}
        </span>
      ) : null}
    </div>
  );
}
