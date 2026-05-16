import Button from "../ui/Button.jsx";
import Card from "../ui/Card.jsx";
import ProfileSettingsPanel from "./ProfileSettingsPanel.jsx";

export default function ProfileSummary({
  activeSettingsSection,
  insight,
  onSettingsSectionChange,
  user,
}) {
  return (
    <div className="md:col-span-4 space-y-gutter">
      <Card
        className="p-6 relative transition-all duration-300"
        hover
      >
        <div className="absolute top-0 right-0 w-32 h-32 bg-surface rounded-bl-full opacity-50 -z-10" />
        <div className="flex flex-col items-center text-center">
          <div className="w-24 h-24 rounded-full overflow-hidden mb-4 border-4 border-surface shadow-sm">
            <img
              alt={user.avatar.alt}
              className="w-full h-full object-cover"
              src={user.avatar.src}
            />
          </div>
          <h2 className="font-card-title text-card-title text-on-surface mb-1">
            {user.name}
          </h2>
          <p className="font-body-md text-body-md text-outline mb-4">
            {user.email}
          </p>
          <div className="flex items-center justify-center space-x-2 text-on-surface-variant font-metadata text-metadata bg-surface-container-low px-3 py-1.5 rounded-full mb-6">
            <span className="material-symbols-outlined text-[18px]">
              language
            </span>
            <span>{user.language}</span>
          </div>
          <Button
            className="w-full rounded-[16px]"
            variant="outline"
          >
            <span className="material-symbols-outlined mr-1 text-[20px]">
              edit
            </span>
            Edit Profile
          </Button>
        </div>
      </Card>

      <Card className="bg-surface-light p-6 relative">
        <div className="absolute -right-4 -top-4 w-20 h-20 bg-[#FFD278] rounded-full opacity-20" />
        <div className="flex items-start">
          <div className="bg-[#FFD278] text-[#242426] p-2 rounded-lg mr-4 flex-shrink-0">
            <span
              className="material-symbols-outlined"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              auto_awesome
            </span>
          </div>
          <div>
            <h3 className="font-card-title text-card-title text-on-surface mb-2">
              {insight.title}
            </h3>
            <p className="font-body-md text-body-md text-on-surface-variant">
              {insight.body}
            </p>
          </div>
        </div>
      </Card>

      <ProfileSettingsPanel
        activeSection={activeSettingsSection}
        onSectionChange={onSettingsSectionChange}
      />
    </div>
  );
}
