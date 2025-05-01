// src/components/SongCreate/SelectWeekSongs.tsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AxiosInstance from "@/components/axios";
import { Sidebar } from "@/components/Layout/Sidebar";
import { useIsMobile } from "@/hooks/use-mobile";
import SearchBar from "@/components/reuse/SearchBar";
import SongCard from "./SongCard"; // unchanged
import GreenButton from "@/components/reuse/GreenButton"; // NEW import

interface Song {
  id: number;
  title: string;
  artist: string;
  image_url: string;
  key?: string;
  tempo?: string;
  time_signature?: string;
}

const SelectWeekSongs: React.FC = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile(); // still available if you need it

  const [allSongs, setAllSongs] = useState<Song[]>([]);
  const [selectedSongs, setSelectedSongs] = useState<Song[]>(() => {
    const stored = localStorage.getItem("weekSongs");
    return stored ? JSON.parse(stored) : [];
  });
  const [searchInput, setSearchInput] = useState("");

  useEffect(() => {
    AxiosInstance.get("songs/", { params: { page: 1, page_size: 1000 } })
      .then((response) => {
        setAllSongs(response.data.songs);
      })
      .catch((err) => console.error("Error fetching songs:", err));
  }, []);

  // Client-side filter by title or artist
  const filteredSongs = allSongs.filter(
    (song) =>
      song.title.toLowerCase().includes(searchInput.toLowerCase()) ||
      song.artist.toLowerCase().includes(searchInput.toLowerCase())
  );

  const handleSongSelect = (songId: number) => {
    const song = allSongs.find((s) => s.id === songId);
    if (!song) return;

    if (selectedSongs.some((s) => s.id === songId)) {
      // remove if already selected
      setSelectedSongs(selectedSongs.filter((s) => s.id !== songId));
    } else if (selectedSongs.length < 4) {
      // add up to 4
      setSelectedSongs([...selectedSongs, song]);
    }
  };

  const handleSave = () => {
    if (selectedSongs.length === 4) {
      localStorage.setItem("weekSongs", JSON.stringify(selectedSongs));
      navigate("/week-songs");
    }
  };

  return (
    <div className="relative flex min-h-screen bg-[#EFF1F7]">
      <Sidebar />
      <div className="flex-1 transition-all duration-300 ml-0">
        <div className="p-6">
          {/* Heading & search bar */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">Select 4 Songs for this Week</h2>
            <SearchBar
              searchInput={searchInput}
              onSearchInputChange={setSearchInput}
              onSubmit={(e) => e.preventDefault()}
            />
          </div>

          {/* Song grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredSongs.map((song) => (
              <SongCard
                key={song.id}
                song={song}
                isSelected={selectedSongs.some((s) => s.id === song.id)}
                selectMode // hides edit/delete buttons inside SongCard
                onClick={() => handleSongSelect(song.id)}
              />
            ))}
          </div>

          {/* Reusable green button */}
          {/* below the song grid */}
<div className="mt-6 ml-1">
  <GreenButton
    onClick={handleSave}
    disabled={selectedSongs.length !== 4}
    label={selectedSongs.length !== 4 ? "Select 4 Songs" : "Select Song"}
    className={`flex items-center gap-2 px-5 py-2 rounded-lg font-bold text-white text-[1.1rem] transition-all duration-200 shadow-md
      ${
        selectedSongs.length !== 4
          ? "bg-gray-400 cursor-not-allowed"
          : "bg-green-700 hover:bg-green-800"
      }`}
  />
</div>

        </div>
      </div>
    </div>
  );
};

export default SelectWeekSongs;
