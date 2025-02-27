import React from "react";

export const ProfileSection = () => {
  return (
    <div className="shadow-[0px_0px_8px_2px_rgba(0,0,0,0.25)]
                    bg-white
                    flex
                    flex-col
                    items-center
                    text-2xl
                    text-black
                    font-semibold
                    text-center
                    w-full
                    p-8
                    rounded-[15px]">
      <h2 className="mb-4">Your Profile</h2>
      <img
        loading="lazy"
        srcSet="https://cdn.builder.io/api/v1/image/assets/d05f7b0812fd4640ab4ab69bdae91b88/ae978e8461ea892e399e2263eaf02894a8a92d0765ce3c927168e7403727ddc0?placeholderIfAbsent=true&width=100 100w"
        alt="Profile"
        className="aspect-[1] object-contain w-[201px] max-w-full mb-4"
      />
      <div>john</div>
      <div className="mt-2">961321104000</div>
    </div>
  );
};
