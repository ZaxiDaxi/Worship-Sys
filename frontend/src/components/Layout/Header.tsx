import React from "react";
import { useNavigate } from "react-router-dom";
import AxiosInstance from "@/components/axios";

export const Header: React.FC = () => {
  const navigate = useNavigate();

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

  return (
    <header
      className="
        /* shadow on all screens */
        shadow-[0px_4px_4px_rgba(0,0,0,0.25)]
        
        bg-[#EFF1F7]

        flex
        w-full
        items-stretch
        gap-5
        text-black
        whitespace-nowrap
        text-center
        flex-wrap
        justify-between
        px-7
        py-[15px]
      "
    >
      {/* Left side (logo/title) */}
      <div className="flex items-stretch gap-[18px] text-2xl font-semibold my-auto">
        {/* If you have a header title or logo, place it here */}
      </div>

      {/* Right side: hidden on mobile, visible on md+ */}
      <div className="flex items-stretch gap-[29px] font-medium">
        <div className="flex items-stretch gap-2 text-2xl">
          <img
            loading="lazy"
            src="https://cdn.builder.io/api/v1/image/assets/d05f7b0812fd4640ab4ab69bdae91b88/a189dc97efbdb147e16deae28d4e91bc31ca3bb86c14d9076506c980a0ed3503?width=100"
            className="aspect-[1] object-contain w-[65px] shrink-0"
            alt="User avatar"
          />
          <span className="my-auto">john</span>
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
