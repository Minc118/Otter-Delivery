import { cx } from "../../utils/classNames.js";

const variantClasses = {
  primary:
    "bg-primary-container hover:bg-surface-tint text-on-primary shadow-sm",
  secondary:
    "bg-transparent border border-primary text-primary hover:bg-surface",
  outline:
    "bg-transparent border-2 border-primary-container text-primary-container hover:bg-surface",
  ghost: "bg-transparent text-primary hover:bg-surface",
};

const sizeClasses = {
  sm: "py-2 px-4 rounded-lg",
  md: "py-3 px-6 rounded-lg",
  lg: "py-4 px-8 rounded-xl",
};

export default function Button({
  children,
  className,
  size = "md",
  type = "button",
  variant = "primary",
  ...props
}) {
  return (
    <button
      className={cx(
        "font-button text-button transition-colors duration-200 inline-flex items-center justify-center gap-2 active:scale-95",
        variantClasses[variant],
        sizeClasses[size],
        className,
      )}
      type={type}
      {...props}
    >
      {children}
    </button>
  );
}
