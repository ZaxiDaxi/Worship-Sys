import React, { useState, useEffect } from "react";
import { Sidebar } from "@/features/Layout/Sidebar";
import { Header } from "@/features/Layout/Header";
import { StatCard } from "@/features/Overview/StatCard";
import { ProfileSection } from "@/features/Overview/ProfileSection";
import { PersonalDetails } from "@/features/Overview/PersonalDetails";
import AxiosInstance from "@/api/axios"; 
import PianoIcon from '@mui/icons-material/Piano';
import AccountBoxIcon from '@mui/icons-material/AccountBox';
import GroupsIcon from '@mui/icons-material/Groups';


const Index = () => {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        // Use AxiosInstance to fetch the profile
        const response = await AxiosInstance.get("profiles/me/");
        setProfile(response.data);
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
      icon: <GroupsIcon fontSize="large"/>,
      title: "Team",
      value: profile.team || "N/A",
    },
    {
      icon: <AccountBoxIcon fontSize="large"/>,
      title: "Attendance",
      value: profile.attendance || "N/A",
    },
    {
      icon: <PianoIcon fontSize="large"/>,
      title: "Instrument",
      value: profile.instrument || "N/A",
    },
  ];

  return (
    <div className="relative flex min-h-screen bg-inherit">
      <Sidebar />
      <div className="flex-1 transition-all duration-300">
        <Header />
        <main className="p-6">
          <section className="shadow-[0px_1px_5px_2px_rgba(0,0,0,0.25)] bg-white flex flex-col text-2xl text-black text-center m-0 md:mx-6 mt-0 md:mt-6 p-4 md:p-8 rounded-none md:rounded-[15px]">
            <h1 className="font-semibold">Welcome {profile.user || "User"}</h1>
            <div className="flex w-full max-w-[1209px] items-stretch gap-6 font-medium flex-wrap mt-8 justify-center mx-auto">
              {stats.map((stat, index) => (
                <StatCard key={index} {...stat} />
              ))}
            </div>
          </section>
          <section className="mt-6 mx-0 md:mx-6 bg-transparent md:bg-white shadow-none md:shadow-[0px_1px_5px_2px_rgba(0,0,0,0.25)] p-0 md:p-6 rounded-none md:rounded-[15px]">
            <div className="flex flex-col lg:flex-row gap-6">
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
