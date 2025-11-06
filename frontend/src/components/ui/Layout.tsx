import React, { ReactNode } from "react";
import { Sidebar } from "@/features/Layout/Sidebar";

interface LayoutProps {
  children: ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <>
      {/*
        For small screens: bg-white (or no background).
        For md+ screens:   bg-[#EFF1F7].
      */}
      <div className="min-h-screen w-full flex flex-col md:flex-row bg-white md:bg-[#EFF1F7] m-0 p-0">
        <Sidebar />
        <main className="flex-1 mt-16 md:mt-0 md:ml-64 p-0 md:p-4">
          {children}
        </main>
      </div>
    </>
  );
};
