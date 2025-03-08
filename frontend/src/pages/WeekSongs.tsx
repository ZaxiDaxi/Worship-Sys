import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { Sidebar } from "@/components/Layout/Sidebar";
import { Header } from "@/components/Layout/Header";
import { Plus, Trash2 } from "lucide-react";
import AddCircleIcon from '@mui/icons-material/AddCircle';
import { IconButton } from "@mui/material";

interface Song {
  id: number;
  title: string;
  artist: string;
  key?: string;
  tempo?: string;
  time_signature?: string;
}

const WeekSongs = () => {
  const navigate = useNavigate();
  const [weekSongs, setWeekSongs] = useState<Song[]>(() => {
    const stored = localStorage.getItem("weekSongs");
    return stored ? JSON.parse(stored) : [];
  });

  useEffect(() => {
    localStorage.setItem("weekSongs", JSON.stringify(weekSongs));
  }, [weekSongs]);

  const handleEditSongs = () => {
    navigate("/select-week-songs");
  };

  const handleDelete = (songId: number) => {
    setWeekSongs((prevSongs) => prevSongs.filter((song) => song.id !== songId));
  };

  return (
    <div className="relative flex min-h-screen bg-white">
      <Sidebar />

      {/* Removed md:ml-64 to avoid pushing content on larger screens */}
      <div className="flex-1 transition-all duration-300">
        <div className="hidden md:block">
          <Header />
        </div>
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">This Week's Featured Songs</h2>
            <IconButton onClick={handleEditSongs} ><AddCircleIcon sx={{ color: "black", width: 40, height: 40 }} />

            </IconButton>


          </div>

          {weekSongs.length > 0 ? (
            <div className="space-y-4">
              {weekSongs.map((song) => (
                <Card
                  key={song.id}
                  className="p-4 hover:bg-gray-50 cursor-pointer flex items-center"
                  onClick={() => navigate(`/songs/${song.id}`)}
                >
                  <div className="flex flex-grow items-center">
                    <div className="ml-4">
                      <h3 className="font-semibold truncate">{song.title}</h3>
                      <p className="text-gray-600 truncate">{song.artist}</p>
                      <div className="text-sm text-gray-500 mt-1 flex gap-2">
                        <span>Key: {song.key}</span>
                        <span>Tempo: {song.tempo}</span>
                        <span>Time: {song.time_signature}</span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(song.id);
                    }}
                    className="ml-auto text-red-500 hover:text-red-700 p-2 rounded-lg"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </Card>
              ))}
            </div>
          ) : (
            <p className="text-gray-600">
              No week songs selected. Click the button above to choose songs for this week.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default WeekSongs;
