import { cx } from "../../utils/classNames.js";

export default function IconButton({
  active,
  className,
  icon,
  label,
  type = "button",
  ...props
}) {
  return (
    <button
      aria-label={label}
      className={cx(
        "text-on-surface-variant hover:text-primary transition-all duration-150 active:scale-95 p-2 rounded-full",
        active && "text-primary",
        className,
      )}
      type={type}
      {...props}
    >
      <span
        className="material-symbols-outlined"
        style={active ? { fontVariationSettings: "'FILL' 1" } : undefined}
      >
        {icon}
      </span>
    </button>
  );
}
