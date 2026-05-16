export default function SupportCard() {
  return (
    <div className="bg-surface-light rounded-xl p-6 border border-surface-tint/10 flex flex-col items-center text-center">
      <span className="material-symbols-outlined text-primary text-[32px] mb-3">
        help_center
      </span>
      <h3 className="font-card-title text-card-title text-on-surface mb-2">
        Need Help?
      </h3>
      <p className="font-body-md text-body-md text-on-surface-variant mb-4 text-sm">
        Contact the restaurant or Otter support.
      </p>
      <button
        className="bg-transparent border border-primary text-primary hover:bg-surface transition-colors duration-200 font-button text-button py-3 px-6 rounded-lg w-full"
        type="button"
      >
        Contact Support
      </button>
    </div>
  );
}
