export default function TrackingStatusHeader({ order }) {
  return (
    <section className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-surface-container-lowest p-6 rounded-xl border border-surface shadow-[0_12px_32px_rgba(36,36,38,0.04)]">
      <div>
        <h1 className="font-page-title text-page-title text-on-surface mb-2">
          {order.statusTitle}
        </h1>
        <p className="font-body-md text-body-md text-on-surface-variant flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-primary-container inline-block" />
          Status: {order.statusText}
        </p>
      </div>
      <div className="text-right">
        <p className="font-metadata text-metadata text-on-surface-variant mb-1">
          Estimated Arrival
        </p>
        <p className="font-section-title text-section-title text-primary">
          {order.estimatedArrival}
        </p>
      </div>
    </section>
  );
}
