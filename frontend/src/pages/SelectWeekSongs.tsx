// SelectWeekSongs.tsx
import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import AxiosInstance from "@/components/axios";
import { Sidebar } from "@/components/Layout/Sidebar";
import { useIsMobile } from "@/hooks/use-mobile";
import { Search } from "lucide-react";

interface Song {
  id: number;
  title: string;
  artist: string;
  image_url: string;
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
  const [searchInput, setSearchInput] = useState("");

  useEffect(() => {
    AxiosInstance.get("songs/", { params: { page: 1, page_size: 1000 } })
      .then((response) => {
        setAllSongs(response.data.songs);
      })
      .catch((err) => console.error("Error fetching songs:", err));
  }, []);

  // Filter client-side by title or artist
  const filteredSongs = allSongs.filter(
    (song) =>
      song.title.toLowerCase().includes(searchInput.toLowerCase()) ||
      song.artist.toLowerCase().includes(searchInput.toLowerCase())
  );

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
      <div className="flex-1 transition-all duration-300 ml-0">
        <div className="p-6">
          {/* Row: heading on the left, search form on the right */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">Select 4 Songs for this Week</h2>
            <form
              onSubmit={(e) => e.preventDefault()}
              className="flex items-center w-80 bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm"
            >
              <input
                type="text"
                placeholder="Search songs..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-full px-4 py-2 focus:outline-none"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-white  text-grey flex items-center justify-center"
              >
                <Search className="h-5 w-5" />
              </button>
            </form>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredSongs.map((song) => (
              <Card
                key={song.id}
                className={`p-4 cursor-pointer ${selectedSongs.some((s) => s.id === song.id)
                    ? "border-4 border-blue-500"
                    : "hover:bg-gray-50"
                  }`}
                onClick={() => handleSongSelect(song.id)}
              >
                <div className="flex items-center space-x-4">
                  <img
                    src={song.image_url || "https://via.placeholder.com/50"}
                    alt={song.title}
                    className="w-12 h-12 rounded-full object-cover"
                  />
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
