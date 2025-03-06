import React from "react";

interface ProfileSectionProps {
  profile: any;
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
        src="https://cdn.builder.io/api/v1/image/assets/d05f7b0812fd4640ab4ab69bdae91b88/ae978e8461ea892e399e2263eaf02894a8a92d0765ce3c927168e7403727ddc0"
        alt="Profile"
        className="aspect-[1] object-contain w-[200px] max-w-full mb-4"
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
