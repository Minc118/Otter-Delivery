export default function PagePlaceholder({ title }) {
  return (
    <section className="px-margin-x py-24 max-w-container-max mx-auto">
      <div className="rounded-xl border border-surface bg-surface-light p-8">
        <h1 className="font-page-title text-page-title text-on-surface mb-stack-md">
          {title}
        </h1>
        <p className="font-body-md text-body-md text-on-surface-variant">
          This page will be converted from the next Stitch HTML file.
        </p>
      </div>
    </section>
  );
}
