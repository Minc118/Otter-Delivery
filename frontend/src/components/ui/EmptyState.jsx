import { cx } from "../../utils/classNames.js";

export default function EmptyState({
  className,
  description,
  icon = "inbox",
  title,
}) {
  return (
    <div
      className={cx(
        "flex min-h-[360px] flex-col items-center justify-center text-center",
        className,
      )}
    >
      <div className="w-16 h-16 rounded-full bg-surface-light text-primary grid place-items-center mb-stack-md">
        <span className="material-symbols-outlined text-[32px]">{icon}</span>
      </div>
      <h3 className="font-card-title text-card-title text-on-surface mb-2">
        {title}
      </h3>
      {description ? (
        <p className="font-body-md text-body-md text-on-surface-variant max-w-[320px]">
          {description}
        </p>
      ) : null}
    </div>
  );
}
