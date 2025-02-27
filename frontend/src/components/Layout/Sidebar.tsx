
import React, { useState, useEffect } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { Menu, X } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";

const menuItems = [
  { id: 1, label: "Overview", path: "/" },
  { id: 2, label: "Songs", path: "/songs" },
  { id: 3, label: "Week Songs", path: "/week-songs" },
  { id: 4, label: "Create Song", path: "/create-song" },
  { id: 5, label: "Guitar Tabs", path: "/guitar-tabs" }
];

export const Sidebar = () => {
  const isMobile = useIsMobile();
  const [isOpen, setIsOpen] = useState(!isMobile);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (isMobile) {
      setIsOpen(false);
    }
  }, [location.pathname, isMobile]);

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  const handleNavigation = (item: { path?: string }) => {
    if (item.path) {
      navigate(item.path);
    }
    if (isMobile) {
      setIsOpen(false);
    }
  };

  return (
    <>
      {isMobile && (
        <button
          onClick={toggleSidebar}
          className="fixed top-4 left-4 z-50 p-2 bg-white rounded-md shadow-md"
        >
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      )}

      <aside
        className={`bg-white shadow-lg flex flex-col text-2xl text-black font-medium transition-all duration-300 overflow-y-scroll scrollbar-hide ${
          isMobile
            ? `fixed top-0 left-0 h-full w-full z-40 ${
                isOpen ? "translate-x-0" : "-translate-x-full"
              }`
            : "w-64 h-screen fixed top-0 left-0 z-40"
        }`}
      >
        <div className="sticky top-0 bg-white p-5 flex flex-col items-center z-50">
          <img
            loading="lazy"
            src="https://cdn.builder.io/api/v1/image/assets/d05f7b0812fd4640ab4ab69bdae91b88/3ec5a9a16e2245553521d222bbdf61c36c1f2a41e1d77423a7d57c7e78628eaf"
            className="w-[100px] mx-auto"
            alt="Logo"
          />
        </div>

        <nav className="flex-1 overflow-y-auto min-h-screen flex flex-col items-center space-y-4 py-5 scrollbar-hide">
          {menuItems.map((item) => (
            <div
              key={item.id}
              className={`w-3/4 text-center px-6 py-3 rounded-lg cursor-pointer transition-colors duration-200 hover:bg-[#16BBE5]/80 ${
                location.pathname === item.path
                  ? "bg-[#16BBE5] text-black"
                  : "bg-white hover:text-black"
              }`}
              onClick={() => handleNavigation(item)}
            >
              <span>{item.label}</span>
            </div>
          ))}
        </nav>
      </aside>

      <style>
        {`
          .scrollbar-hide::-webkit-scrollbar {
            display: none;
          }
          .scrollbar-hide {
            -ms-overflow-style: none;
            scrollbar-width: none;
          }
        `}
      </style>
    </>
  );
};
