import Badge from "../ui/Badge.jsx";
import Card from "../ui/Card.jsx";

export default function AIPickCard({ pick }) {
  return (
    <Card className="p-4 flex flex-col gap-4 hover:shadow-stitch transition-shadow">
      <div className="h-32 rounded-lg overflow-hidden relative">
        {pick.badge ? (
          <Badge
            className="absolute top-2 left-2 z-10 rounded text-dark-text px-2 py-1 font-bold"
            icon={pick.badgeIcon}
            variant="ai"
          >
            {pick.badge}
          </Badge>
        ) : null}
        <img
          alt={pick.image.alt}
          className="w-full h-full object-cover"
          src={pick.image.src}
        />
      </div>
      <div>
        <h4 className="font-card-title text-card-title text-on-surface">
          {pick.name}
        </h4>
        <p className="font-body-md text-body-md text-on-surface-variant">
          {pick.cuisine} • {pick.priceTier}
        </p>
      </div>
    </Card>
  );
}
