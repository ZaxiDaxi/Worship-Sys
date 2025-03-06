// Layout.tsx
import React, { ReactNode } from "react";
import { Sidebar } from "../Layout/Sidebar";

interface LayoutProps {
  children: ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    // On md+ screens, use flex-row with the sidebar on the left
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Sidebar always rendered, but its internal code will decide 
          how to display it (inline vs. mobile overlay). */}
      <Sidebar />

      {/* Main content takes remaining space. 
          On md+ screens, we push main content right of the sidebar 
          by applying `md:ml-64` if the sidebar is a fixed width. */}
      <main className="flex-1 mt-16 md:mt-0 md:ml-64 p-4">
        {children}
      </main>
    </div>
  );
};
