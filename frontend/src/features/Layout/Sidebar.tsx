import React, { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";
import logo from "@/assets/header-photo.png"

interface SidebarProps {
  onToggle?: (open: boolean) => void;
}

const menuItems = [
  { id: 1, label: "Overview", path: "/" },
  { id: 2, label: "Songs", path: "/songs" },
  { id: 3, label: "Week Songs", path: "/week-songs" },
  { id: 4, label: "Create Song", path: "/create-song" },
  { id: 5, label: "Guitar Tabs", path: "/guitar-tabs" }
];

export const Sidebar: React.FC<SidebarProps> = ({ onToggle }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useIsMobile();
  const [isOpen, setIsOpen] = useState(!isMobile);

  // When screen size or route changes, set default sidebar state
  useEffect(() => {
    if (isMobile) {
      setIsOpen(false);
    } else {
      setIsOpen(true);
    }
  }, [isMobile, location.pathname]);

  const toggleSidebar = () => {
    const newState = !isOpen;
    setIsOpen(newState);
    if (onToggle) {
      onToggle(newState);
    }
  };

  const handleNavigation = (path: string | undefined) => {
    if (path) {
      navigate(path);
      if (isMobile) {
        setIsOpen(false);
        if (onToggle) {
          onToggle(false);
        }
      }
    }
  };

  return (
    <>
      {isMobile && (
        <button
          onClick={toggleSidebar}
          className="fixed top-4 left-4 z-50 p-2 mt-2 bg-white rounded-md shadow-md md:hidden flex items-center justify-center"
        >
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      )}

      <aside
        className={`
          bg-white shadow-lg flex flex-col text-2xl text-black font-medium
          transition-transform duration-300 overflow-y-auto
          ${isMobile ? "fixed" : "fixed md:fixed"}
          top-0 left-0 h-screen z-40
          ${
            isMobile
              ? (isOpen ? "translate-x-0 w-[100%]" : "-translate-x-full w-[100%]")
              : "w-64 translate-x-0"
          }
        `}
      >
        <div className="sticky top-0 bg-white p-5 flex flex-col items-center z-50">
          <img
            loading="lazy"
            src={logo}
            className="w-[100px] mx-auto"
            alt="Logo"
          />
        </div>

        <nav className="flex-1 flex flex-col items-center space-y-4 py-5">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <div
                key={item.id}
                className={`
                  w-3/4 text-center px-6 py-3 rounded-lg cursor-pointer
                  transition-colors duration-200
                  ${isActive ? "bg-[#16BBE5] text-black" : "bg-white hover:bg-[#16BBE5]/80"}
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

export default Sidebar;
