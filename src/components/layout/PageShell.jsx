import { cx } from "../../utils/classNames.js";

export default function PageShell({
  as: Component = "div",
  children,
  className,
  padded = true,
}) {
  return (
    <Component
      className={cx(
        "w-full max-w-container-max mx-auto",
        padded && "px-margin-x",
        className,
      )}
    >
      {children}
    </Component>
  );
}
