import { cx } from "../../utils/classNames.js";

export default function Card({
  as: Component = "div",
  children,
  className,
  hover = false,
}) {
  return (
    <Component
      className={cx(
        "bg-surface-container-lowest rounded-xl border border-surface overflow-hidden",
        hover && "hover:border-primary-light hover:shadow-stitch transition-all duration-300",
        className,
      )}
    >
      {children}
    </Component>
  );
}
