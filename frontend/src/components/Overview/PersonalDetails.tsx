// PersonalDetails.tsx
import React from "react";
import { Link } from "react-router-dom";

interface PersonalDetailsProps {
  profile: any; // You can create a specific interface if you want
}

export const PersonalDetails: React.FC<PersonalDetailsProps> = ({ profile }) => {
  if (!profile) {
    return <div>No personal details to show.</div>;
  }

  return (
    <div
      className="
        shadow-[0px_0px_8px_2px_rgba(0,0,0,0.25)]
        bg-white
        rounded-[15px]
        p-8
        w-full
        h-full
        flex
        flex-col
        justify-between
      "
    >
      <h2 className="text-3xl font-bold text-gray-700 border-b pb-3">
        Personal Details
      </h2>
      <div className="grid grid-cols-2 gap-x-12 gap-y-6 mt-6 text-xl">
        <div>
          <p>
            <span className="font-semibold text-gray-600">DOB:</span>{" "}
            {profile.dob || "N/A"}
          </p>
          <p>
            <span className="font-semibold text-gray-600">Gender:</span>{" "}
            {profile.gender || "N/A"}
          </p>
          <p>
            <span className="font-semibold text-gray-600">Department:</span>{" "}
            {profile.department || "N/A"}
          </p>
        </div>
        <div>
          <p>
            <span className="font-semibold text-gray-600">Nationality:</span>{" "}
            {profile.nationality || "N/A"}
          </p>
          <p>
            <span className="font-semibold text-gray-600">Mobile:</span>{" "}
            {profile.mobile || "N/A"}
          </p>
          <p>
            <span className="font-semibold text-gray-600">Address:</span>{" "}
            {profile.address || "N/A"}
          </p>
        </div>
      </div>

      <div className="mt-6 text-center text-lg text-gray-700">
        <p className="font-semibold">Song this Week</p>
        <Link to="/week-songs">
          <button className="mt-2 font-semibold bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded">
            Go to Week Songs
          </button>
        </Link>
      </div>
    </div>
  );
};
