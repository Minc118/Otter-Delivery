import { cx } from "../../utils/classNames.js";

export default function SectionHeader({ children, className, icon }) {
  return (
    <div className={cx("flex items-center gap-2 mb-stack-lg", className)}>
      {icon ? (
        <span
          className="material-symbols-outlined text-tertiary-fixed-dim"
          style={{ fontVariationSettings: "'FILL' 1" }}
        >
          {icon}
        </span>
      ) : null}
      <h2 className="font-section-title text-section-title text-on-surface">
        {children}
      </h2>
    </div>
  );
}
