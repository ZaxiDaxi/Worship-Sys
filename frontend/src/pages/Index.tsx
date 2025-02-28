// Index.tsx
import React, { useState, useEffect } from "react";
import { Sidebar } from "@/components/Layout/Sidebar";
import { Header } from "@/components/Layout/Header";
import { StatCard } from "@/components/Overview/StatCard";
import { ProfileSection } from "@/components/Overview/ProfileSection";
import { PersonalDetails } from "@/components/Overview/PersonalDetails";

const Index = () => {
  // State to hold the user profile
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");

  // Fetch profile once when component mounts
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        // Use the same key ("accessToken") as in your axios instance
        const token = localStorage.getItem("accessToken");
        if (!token) {
          throw new Error("No access token. Please log in.");
        }
        // Calling the correct endpoint (http://127.0.0.1:8000/api/profiles/me/)
        const response = await fetch("http://127.0.0.1:8000/api/profiles/me/", {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error(`Request failed with status ${response.status}`);
        }

        const data = await response.json();
        setProfile(data);
      } catch (err: any) {
        setError(err.message || "Error fetching profile");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  // Handle loading / error states
  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!profile) return <div>No profile data.</div>;

  // Build your "stats" array from the user profile so that
  // "team", "attendance", and "instrument" come from the backend
  const stats = [
    {
      icon: "https://cdn.builder.io/api/v1/image/assets/d05f7b0812fd4640ab4ab69bdae91b88/46fe4f3371bc81444841a9f3bc506750f244c3d35e0047f38d56f60b7bd74850?placeholderIfAbsent=true&width=100 100w",
      title: "Team",
      value: profile.team || "N/A",
    },
    {
      icon: "https://cdn.builder.io/api/v1/image/assets/d05f7b0812fd4640ab4ab69bdae91b88/cc6dbc54f4d515dff6e2d310064b3a58b09b2452735fa2601ed8cdf7a62a08f6?placeholderIfAbsent=true&width=100 100w",
      title: "Attendance",
      value: profile.attendance || "N/A",
    },
    {
      icon: "https://cdn.builder.io/api/v1/image/assets/d05f7b0812fd4640ab4ab69bdae91b88/94fcdcdabbd7f011a4182944a5b0f9a10c3c7e10f24a157a9e81314bbdd69d26?placeholderIfAbsent=true&width=100 100w",
      title: "Instrument",
      value: profile.instrument || "N/A",
    },
  ];

  return (
    <div className="border bg-[#EFF1F7] overflow-hidden border-solid border-black">
      <div className="gap-5 flex max-md:flex-col max-md:items-stretch">
        {/* Sidebar */}
        <div className="w-[16%] max-md:w-full max-md:ml-0">
          <Sidebar />
        </div>

        {/* Main Content */}
        <div className="w-[84%] ml-5 max-md:w-full max-md:ml-0">
          <div className="w-full max-md:max-w-full">
            <Header />

            <main>
              {/* Overview Section */}
              <section className="shadow-[0px_1px_5px_2px_rgba(0,0,0,0.25)] bg-white flex flex-col text-2xl text-black text-center ml-[26px] mr-[25px] mt-14 pl-[23px] pr-[67px] pt-[17px] pb-[81px] rounded-[15px]">
                <h1 className="font-semibold">Welcome {profile.user || "User"}</h1>
                <div className="flex w-full max-w-[1209px] items-stretch gap-[40px_91px] font-medium whitespace-nowrap flex-wrap mt-[45px] justify-center mx-auto">
                  {stats.map((stat, index) => (
                    <StatCard key={index} {...stat} />
                  ))}
                </div>
              </section>

              {/* Profile and Personal Details Section */}
              <section className="ml-[31px] mr-[25px] mt-[35px]">
                <div className="gap-5 flex max-md:flex-col max-md:items-stretch">
                  <div className="w-[41%] max-md:w-full max-md:ml-0">
                    <ProfileSection profile={profile} />
                  </div>
                  <div className="w-[59%] ml-5 max-md:w-full max-md:ml-0">
                    <PersonalDetails profile={profile} />
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
