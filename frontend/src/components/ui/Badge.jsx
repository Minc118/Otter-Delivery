import { cx } from "../../utils/classNames.js";

const variantClasses = {
  ai: "bg-tertiary-fixed text-on-tertiary-fixed",
  warm: "bg-surface-light text-on-tertiary-fixed",
  neutral: "bg-surface text-on-surface-variant",
  primary: "bg-primary-fixed text-primary",
};

export default function Badge({
  children,
  className,
  icon,
  variant = "neutral",
}) {
  return (
    <span
      className={cx(
        "font-metadata text-metadata px-3 py-1 rounded-full inline-flex items-center gap-1",
        variantClasses[variant],
        className,
      )}
    >
      {icon ? (
        <span className="material-symbols-outlined text-[16px]">{icon}</span>
      ) : null}
      {children}
    </span>
  );
}
