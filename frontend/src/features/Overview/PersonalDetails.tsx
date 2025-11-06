import React from "react";
import { Link } from "react-router-dom";
import MusicNoteIcon from "@mui/icons-material/MusicNote";
import Button from "@mui/material/Button";
interface PersonalDetailsProps {
  profile: any;
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
        p-6
        w-full
        h-full
        flex
        flex-col
        justify-between
      "
    >
      <h2 className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-700 border-b pb-2">
        Personal Details
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 mt-4 text-base md:text-lg lg:text-xl">
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

      <div className="mt-6 text-center text-base md:text-lg lg:text-xl text-gray-700">
        <p className="font-semibold">Song this Week</p>
        <Link to="/week-songs">
        <Button
                type="submit"
                variant="contained"
                startIcon={<MusicNoteIcon />}
                sx={{
                  backgroundColor: "#2E7D32",
                  color: "#FFFFFF",
                  fontWeight: "bold",
                  fontSize: "1.1rem",
                  padding: "8px 18px",
                  borderRadius: "8px",
                  transition: "background-color 0.2s ease-in-out",
                  boxShadow: "0px 4px 6px rgba(0, 0, 0, 0.1)",
                  marginTop: "12px",
                  "&:hover": {
                    backgroundColor: "#1B5E20",
                    boxShadow: "0px 6px 8px rgba(0, 0, 0, 0.15)",
                  },
                }}
              >
                This Week Songs
              </Button>
        </Link>
      </div>
    </div>
  );
};
