import React from "react";
import AccountCircleIcon from '@mui/icons-material/AccountCircle';

interface ProfileSectionProps {
  profile: any;
}

export const ProfileSection: React.FC<ProfileSectionProps> = ({ profile }) => {
  if (!profile) {
    return <div>No profile data.</div>;
  }

  // Use the profile photo from the backend.
  // If profile.profile_picture isn't available, fallback to a default URL.
  const imageUrl =
    profile.profile_picture ||
      <AccountCircleIcon/>

  return (
    <div
      className="
        shadow-[0px_0px_8px_2px_rgba(0,0,0,0.25)]
        bg-white
        flex
        flex-col
        items-center
        text-base md:text-lg lg:text-xl
        font-semibold
        text-center
        text-black
        w-full
        p-6
        rounded-[15px]
      "
    >
      <h2 className="mb-4 text-xl md:text-2xl lg:text-3xl">Your Profile</h2>
      <img
        loading="lazy"
        src={imageUrl}
        alt="Profile"
        className="aspect-[1] object-contain w-[200px] max-w-full mb-4 rounded-full"
      />
      <div className="mt-1">
        <strong>Username:</strong> {profile.user}
      </div>
      <div className="mt-1">
        <strong>Team:</strong> {profile.team || "N/A"}
      </div>
      <div className="mt-1">
        <strong>Attendance:</strong> {profile.attendance || "N/A"}
      </div>
      <div className="mt-1">
        <strong>Instrument:</strong> {profile.instrument || "N/A"}
      </div>
    </div>
  );
};
