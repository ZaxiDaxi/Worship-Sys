import React from "react";

interface StatCardProps {
  icon: string;
  title: string;
  value: string;
}

export const StatCard: React.FC<StatCardProps> = ({ icon, title, value }) => {
  return (
    <div className="flex items-center gap-6 px-6 py-4 bg-white border-2 border-[var(--primary,#16BBE5)] rounded-xl shadow-md">
      <img
        loading="lazy"
        src={icon}
        alt={`${title} icon`}
        className="w-14 h-14 object-contain"
      />
      <div className="text-center">
        <div className="text-xl font-semibold text-gray-800">{title}</div>
        <div className="mt-1 text-lg text-gray-600">{value}</div>
      </div>
    </div>
  );
};
