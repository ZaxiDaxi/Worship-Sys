import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import AxiosInstance from "@/components/axios";
import { Sidebar } from "@/components/Layout/Sidebar";
import { useIsMobile } from "@/hooks/use-mobile";

interface Song {
  id: number;
  title: string;
  artist: string;
  // Removed image_url property
  key?: string;
  tempo?: string;
  time_signature?: string;
}

const SelectWeekSongs = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [allSongs, setAllSongs] = useState<Song[]>([]);
  const [selectedSongs, setSelectedSongs] = useState<Song[]>(() => {
    const stored = localStorage.getItem("weekSongs");
    return stored ? JSON.parse(stored) : [];
  });

  useEffect(() => {
    AxiosInstance.get("songs/", { params: { page: 1, page_size: 1000 } })
      .then((response) => {
        setAllSongs(response.data.songs);
      })
      .catch((err) => console.error("Error fetching songs:", err));
  }, []);

  const handleSongSelect = (songId: number) => {
    const song = allSongs.find((s) => s.id === songId);
    if (!song) return;
    if (selectedSongs.some((s) => s.id === songId)) {
      setSelectedSongs(selectedSongs.filter((s) => s.id !== songId));
    } else if (selectedSongs.length < 4) {
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
      <div className={`flex-1 transition-all duration-300 ${isMobile ? "ml-0" : "md:ml-64"}`}>
        <div className="p-6">
          <h2 className="text-2xl font-bold mb-6">Select 4 Songs for this Week</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {allSongs.map((song) => (
              <Card
                key={song.id}
                className={`p-4 cursor-pointer ${
                  selectedSongs.some((s) => s.id === song.id)
                    ? "border-4 border-blue-500"
                    : "hover:bg-gray-50"
                }`}
                onClick={() => handleSongSelect(song.id)}
              >
                <div className="flex items-center space-x-4">
                  {/* Image element removed */}
                  <div>
                    <h3 className="font-semibold">{song.title}</h3>
                    <p className="text-gray-600">{song.artist}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
          <button
            onClick={handleSave}
            className="mt-6 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded"
            disabled={selectedSongs.length !== 4}
          >
            {selectedSongs.length !== 4 ? "Select 4 Songs" : "Save Selection"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SelectWeekSongs;
