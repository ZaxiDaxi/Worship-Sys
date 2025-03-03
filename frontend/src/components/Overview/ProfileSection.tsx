// ProfileSection.tsx
import React from "react";

interface ProfileSectionProps {
  profile: any; // You can create a specific interface if you want
}

export const ProfileSection: React.FC<ProfileSectionProps> = ({ profile }) => {
  if (!profile) {
    return <div>No profile data.</div>;
  }

  return (
    <div
      className="
        shadow-[0px_0px_8px_2px_rgba(0,0,0,0.25)]
        bg-white
        flex
        flex-col
        items-center
        text-2xl
        text-black
        font-semibold
        text-center
        w-full
        p-8
        rounded-[15px]"
    >
      <h2 className="mb-4">Your Profile</h2>
      <img
        loading="lazy"
        src="https://cdn.builder.io/api/v1/image/assets/d05f7b0812fd4640ab4ab69bdae91b88/ae978e8461ea892e399e2263eaf02894a8a92d0765ce3c927168e7403727ddc0"
        alt="Profile"
        className="aspect-[1] object-contain w-[201px] max-w-full mb-4"
      />
      <div className="mt-2">
        <strong>Username:</strong> {profile.user}
      </div>
      <div className="mt-2">
        <strong>Team:</strong> {profile.team || "N/A"}
      </div>
      <div className="mt-2">
        <strong>Attendance:</strong> {profile.attendance || "N/A"}
      </div>
      <div className="mt-2">
        <strong>Instrument:</strong> {profile.instrument || "N/A"}
      </div>
    </div>
  );
};
