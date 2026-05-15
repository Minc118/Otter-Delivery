const footerLinks = ["Privacy", "Terms", "Support", "Global Locations"];

export default function Footer() {
  return (
    <footer className="bg-surface-container dark:bg-on-surface-variant border-t border-surface-variant dark:border-outline-variant mt-auto">
      <div className="flex flex-col md:flex-row justify-between items-center py-stack-lg px-margin-x max-w-container-max mx-auto">
        <div className="font-card-title text-card-title text-primary dark:text-primary-fixed-dim mb-4 md:mb-0">
          Otter Delivery
        </div>
        <div className="flex gap-6 mb-4 md:mb-0">
          {footerLinks.map((link) => (
            <a
              className="font-metadata text-metadata text-on-surface-variant dark:text-surface-variant hover:underline decoration-primary dark:decoration-primary-fixed-dim transition-opacity duration-200 hover:opacity-80"
              href={`#${link.toLowerCase().replaceAll(" ", "-")}`}
              key={link}
            >
              {link}
            </a>
          ))}
        </div>
        <div className="font-metadata text-metadata text-on-surface-variant dark:text-surface-variant">
          © 2024 Otter Delivery. AI-Powered Food Discovery.
        </div>
      </div>
    </footer>
  );
}
