import React, { useRef, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AxiosInstance from "@/api/axios";

export const Header: React.FC = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [profilePicture, setProfilePicture] = useState<string | null>(null);
  const [username, setUsername] = useState<string>("");

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await AxiosInstance.get("profiles/me/");
        setProfilePicture(response.data.profile_picture);
        setUsername(response.data.user || "john");
      } catch (error) {
        console.error("Error fetching profile:", error);
      }
    };
    fetchProfile();
  }, []);

  const handleLogout = async () => {
    try {
      const refreshToken = localStorage.getItem("refreshToken");
      if (refreshToken) {
        await AxiosInstance.post("auth/logout/", { refresh: refreshToken });
      }
    } catch (err) {
      console.error("Error during logout:", err);
    } finally {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      navigate("/login");
    }
  };

  // Instead of immediately uploading, navigate to crop page with image file.
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files && e.target.files[0];
    if (file) {
      console.log("File selected:", file);
      const imageUrl = URL.createObjectURL(file);
      console.log("Navigating to crop page with URL:", imageUrl);
      navigate("/profile/crop", { state: { imageUrl } });
    }
  };
  
  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <header
      className="
        relative z-10 shadow-[0px_4px_4px_rgba(0,0,0,0.25)]
        flex w-full items-stretch gap-5 text-black whitespace-nowrap
        text-center flex-wrap justify-between px-7 py-[15px]
      "
    >
      {/* Left side (logo/title) */}
      <div className="flex items-stretch gap-[18px] text-2xl font-semibold my-auto">
        {/* Your logo or title */}
      </div>

      {/* Right side: avatar and logout */}
      <div className="flex items-stretch gap-[29px] font-medium">
        <div className="flex items-center gap-2 text-2xl">
          <img
            loading="lazy"
            onClick={handleAvatarClick}
            src={
              profilePicture ||
              "https://cdn.builder.io/api/v1/image/assets/d05f7b0812fd4640ab4ab69bdae91b88/a189dc97efbdb147e16deae28d4e91bc31ca3bb86c14d9076506c980a0ed3503?width=100"
            }
            className="w-[65px] h-[65px] object-cover rounded-full cursor-pointer"
            alt="User avatar"
          />
          {/* Hidden file input */}
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            onChange={handleFileChange}
          />
          <span className="my-auto">{username}</span>
        </div>
        <button
          onClick={handleLogout}
          className="bg-[#16BBE5] text-xl my-auto px-[22px] py-[9px] rounded-[5px]"
        >
          Logout
        </button>
      </div>
    </header>
  );
};

export default Header;
