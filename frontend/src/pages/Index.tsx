import React, { useState, useEffect } from "react";
import { Sidebar } from "@/components/Layout/Sidebar";
import { Header } from "@/components/Layout/Header";
import { StatCard } from "@/components/Overview/StatCard";
import { ProfileSection } from "@/components/Overview/ProfileSection";
import { PersonalDetails } from "@/components/Overview/PersonalDetails";

const Index = () => {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem("accessToken");
        if (!token) {
          throw new Error("No access token. Please log in.");
        }
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

  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    window.location.href = "/login";
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return (
      <div style={{ textAlign: "center", marginTop: "2rem" }}>
        <h2>Error: {error}</h2>
        <p>Your token might be expired or invalid.</p>
        <button
          onClick={handleLogout}
          style={{ padding: "0.5rem 1rem", marginTop: "1rem", cursor: "pointer" }}
        >
          Logout
        </button>
      </div>
    );
  }

  if (!profile) {
    return <div>No profile data.</div>;
  }

  const stats = [
    {
      icon: "https://cdn.builder.io/api/v1/image/assets/d05f7b0812fd4640ab4ab69bdae91b88/46fe4f3371bc81444841a9f3bc506750f244c3d35e0047f38d56f60b7bd74850?width=100",
      title: "Team",
      value: profile.team || "N/A",
    },
    {
      icon: "https://cdn.builder.io/api/v1/image/assets/d05f7b0812fd4640ab4ab69bdae91b88/cc6dbc54f4d515dff6e2d310064b3a58b09b2452735fa2601ed8cdf7a62a08f6?width=100",
      title: "Attendance",
      value: profile.attendance || "N/A",
    },
    {
      icon: "https://cdn.builder.io/api/v1/image/assets/d05f7b0812fd4640ab4ab69bdae91b88/94fcdcdabbd7f011a4182944a5b0f9a10c3c7e10f24a157a9e81314bbdd69d26?width=100",
      title: "Instrument",
      value: profile.instrument || "N/A",
    },
  ];

  return (
    <div className="relative flex min-h-screen bg-[#EFF1F7]">
      {/* Sidebar pinned on the left */}
      <Sidebar />

      {/* Main content: remove lg:ml-64 so it doesn't get forced to the right */}
      <div className="flex-1 transition-all duration-300">
        <Header />
        <main className="px-6 py-6">
          {/* Overview Stats Section */}
          <section className="shadow-[0px_1px_5px_2px_rgba(0,0,0,0.25)] bg-white flex flex-col text-2xl text-black text-center mx-0 md:mx-6 mt-6 px-6 py-8 rounded-[15px]">
            <h1 className="font-semibold">Welcome {profile.user || "User"}</h1>
            <div className="flex w-full max-w-[1209px] items-stretch gap-6 font-medium whitespace-nowrap flex-wrap mt-8 justify-center mx-auto">
              {stats.map((stat, index) => (
                <StatCard key={index} {...stat} />
              ))}
            </div>
          </section>

          {/* Profile + PersonalDetails Section */}
          <section className="mt-6 mx-0 md:mx-6">
            <div className="flex flex-col lg:flex-row gap-6">
              {/* Hide user profile on mobile if desired:
                  className="hidden md:block" for the container */}
              <div className="w-full lg:w-[41%]">
                <ProfileSection profile={profile} />
              </div>
              <div className="w-full lg:w-[59%]">
                <PersonalDetails profile={profile} />
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
};

export default Index;
