import React from "react";
import { Sidebar } from "@/components/Layout/Sidebar";
import { Header } from "@/components/Layout/Header";
import { StatCard } from "@/components/Overview/StatCard";
import { ProfileSection } from "@/components/Overview/ProfileSection";
import { PersonalDetails } from "@/components/Overview/PersonalDetails";

const Index = () => {
  const stats = [
    {
      icon: "https://cdn.builder.io/api/v1/image/assets/d05f7b0812fd4640ab4ab69bdae91b88/46fe4f3371bc81444841a9f3bc506750f244c3d35e0047f38d56f60b7bd74850?placeholderIfAbsent=true&width=100 100w",
      title: "Team",
      value: "Worship",
    },
    {
      icon: "https://cdn.builder.io/api/v1/image/assets/d05f7b0812fd4640ab4ab69bdae91b88/cc6dbc54f4d515dff6e2d310064b3a58b09b2452735fa2601ed8cdf7a62a08f6?placeholderIfAbsent=true&width=100 100w",
      title: "Attendance",
      value: "10000%",
    },
    {
      icon: "https://cdn.builder.io/api/v1/image/assets/d05f7b0812fd4640ab4ab69bdae91b88/94fcdcdabbd7f011a4182944a5b0f9a10c3c7e10f24a157a9e81314bbdd69d26?placeholderIfAbsent=true&width=100 100w",
      title: "Instrument",
      value: "Lead Guitar",
    },
  ];

  return (
    <div className="border bg-[#EFF1F7] overflow-hidden border-solid border-black">
      <div className="gap-5 flex max-md:flex-col max-md:items-stretch">
        <div className="w-[16%] max-md:w-full max-md:ml-0">
          <Sidebar />
        </div>
        <div className="w-[84%] ml-5 max-md:w-full max-md:ml-0">
          <div className="w-full max-md:max-w-full">
            <Header />
            <main>
              <section className="shadow-[0px_1px_5px_2px_rgba(0,0,0,0.25)] bg-white flex flex-col text-2xl text-black text-center ml-[26px] mr-[25px] mt-14 pl-[23px] pr-[67px] pt-[17px] pb-[81px] rounded-[15px]">
                <h1 className="font-semibold">Welcome John</h1>
                {/* Add justify-center and mx-auto here */}
                <div className="flex w-full max-w-[1209px] items-stretch gap-[40px_91px] font-medium whitespace-nowrap flex-wrap mt-[45px] justify-center mx-auto">
                  {stats.map((stat, index) => (
                    <StatCard key={index} {...stat} />
                  ))}
                </div>
              </section>

              <section className="ml-[31px] mr-[25px] mt-[35px]">
                <div className="gap-5 flex max-md:flex-col max-md:items-stretch">
                  <div className="w-[41%] max-md:w-full max-md:ml-0">
                    <ProfileSection />
                  </div>
                  <div className="w-[59%] ml-5 max-md:w-full max-md:ml-0">
                    <PersonalDetails />
                  </div>
                </div>
              </section>
            </main>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
