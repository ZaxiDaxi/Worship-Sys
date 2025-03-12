// Sidebar.tsx
import React, { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
// Example mobile hook or a custom media query:
import { useIsMobile } from "@/hooks/use-mobile";

// Example menu items
const menuItems = [
  { id: 1, label: "Overview", path: "/" },
  { id: 2, label: "Songs", path: "/songs" },
  { id: 3, label: "Week Songs", path: "/week-songs" },
  { id: 4, label: "Create Song", path: "/create-song" },
  { id: 5, label: "Guitar Tabs", path: "/guitar-tabs" }
];

export const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useIsMobile();   // true if below some breakpoint (e.g., 768px)
  const [isOpen, setIsOpen] = useState(!isMobile);

  // Whenever the screen size changes to mobile, or we navigate to a new page, close the sidebar
  useEffect(() => {
    if (isMobile) {
      setIsOpen(false);
    } else {
      // On bigger screens, keep it open by default
      setIsOpen(true);
    }
  }, [isMobile, location.pathname]);

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  const handleNavigation = (path: string | undefined) => {
    if (path) {
      navigate(path);
      // Close sidebar if we are on mobile
      if (isMobile) {
        setIsOpen(false);
      }
    }
  };

  return (
    <>
      {/* Hamburger (or X) button on smaller screens */}
      {isMobile && (
        <button
          onClick={toggleSidebar}
          className="fixed top-4 left-4 z-50 p-2 mt-2 bg-white rounded-md shadow-md md:hidden flex items-center justify-center"
        >
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      )}

      {/* The actual sidebar container */}
      <aside
        className={`
          bg-white shadow-lg flex flex-col text-2xl text-black font-medium
          transition-transform duration-300 overflow-y-auto
          ${isMobile ? "fixed" : "fixed md:fixed"}
          top-0 left-0
          h-screen
          z-40
          ${isMobile
            ? // On mobile, slide in/out from the left
              (isOpen ? "translate-x-0 w-[100%]" : "-translate-x-full w-[100%]")
            : // On md+ screens, fix a 16rem wide sidebar on the left
              "w-64 translate-x-0"
          }
        `}
      >
        {/* Logo area */}
        <div className="sticky top-0 bg-white p-5 flex flex-col items-center z-50">
          <img
            loading="lazy"
            src="https://cdn.builder.io/api/v1/image/assets/d05f7b0812fd4640ab4ab69bdae91b88/3ec5a9a16e2245553521d222bbdf61c36c1f2a41e1d77423a7d57c7e78628eaf"
            className="w-[100px] mx-auto"
            alt="Logo"
          />
        </div>

        {/* Nav menu */}
        <nav className="flex-1 flex flex-col items-center space-y-4 py-5">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <div
                key={item.id}
                className={`
                  w-3/4 text-center px-6 py-3 rounded-lg cursor-pointer
                  transition-colors duration-200
                  ${isActive ? "bg-[#16BBE5] text-black"
                             : "bg-white hover:bg-[#16BBE5]/80"}
                `}
                onClick={() => handleNavigation(item.path)}
              >
                {item.label}
              </div>
            );
          })}
        </nav>
      </aside>
    </>
  );
};
