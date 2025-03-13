import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { Sidebar } from "@/components/Layout/Sidebar";
import { Edit, Trash2, Search } from "lucide-react";
import AxiosInstance from "@/components/axios";
import ConfirmationModal from "@/components/ui/ConfirmationModal";
import Toast from "@/components/ui/toast";
import { Header } from "@/components/Layout/Header";

interface Song {
  id: number;
  title: string;
  artist: string;
  key?: string;
  tempo?: string;
  time_signature?: string;
}

const Songs: React.FC = () => {
  const navigate = useNavigate();
  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const defaultPageSize = 5;
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedSongId, setSelectedSongId] = useState<number | null>(null);
  const [toast, setToast] = useState<{
    message: string;
    type?: "success" | "error" | "info";
  } | null>(null);

  // If user is searching, set a large pageSize.
  const pageSize = searchQuery ? 1000 : defaultPageSize;

  useEffect(() => {
    setLoading(true);
    AxiosInstance.get("songs/", {
      params: {
        page: currentPage,
        page_size: pageSize,
        search: searchQuery,
      },
    })
      .then((response) => {
        setSongs(response.data.songs);
        setTotal(response.data.total);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching songs:", error);
        setLoading(false);
      });
  }, [currentPage, searchQuery, pageSize]);

  // Reset to page 1 when search changes.
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const totalPages = Math.ceil(total / defaultPageSize);

  const handleEditSong = (songId: number) => {
    navigate(`/songs/${songId}`);
  };

  const handleDeleteClick = (songId: number) => {
    setSelectedSongId(songId);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (selectedSongId === null) return;
    try {
      await AxiosInstance.delete(`songs/${selectedSongId}/`);
      setToast({ message: "Song deleted successfully", type: "success" });
      setShowDeleteConfirm(false);
      setSelectedSongId(null);
      window.location.reload();
    } catch (error) {
      console.error("Error deleting song:", error);
      setToast({ message: "Error deleting song", type: "error" });
      setShowDeleteConfirm(false);
      setSelectedSongId(null);
    }
  };

  const handleSongClick = (songId: number) => {
    navigate(`/songs/${songId}`);
  };

  return (

    <div className="relative flex min-h-screen bg-white md:bg-white">
      <Sidebar />

      <div className="flex-1 transition-all duration-300">
        <div className="md:block">
          <Header />
        </div>

        {/*
          Remove padding on mobile: p-0
          Restore original padding on md+: md:p-6
        */}
        <div className="p-6">
          <div className="flex flex-col md:flex-row justify-between items-center mb-6 pt-4 md:pt-0 lg:md-0">
            <h2 className="text-2xl font-bold mb-4 md:mb-0">Songs List</h2>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                setSearchQuery(searchInput);
              }}
              className="flex items-center max-w-md bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm"
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
                className="px-4 py-2 bg-white text-grey-600  items-center justify-center"
              >
                <Search className="h-5 w-5" />
              </button>
            </form>
          </div>

          {loading ? (
            <p>Loading songs...</p>
          ) : (
            <>
              <div className="space-y-4">
                {songs.map((song) => (
                  <Card
                    key={song.id}
                    className="p-4 flex justify-between items-center hover:bg-gray-50 cursor-pointer bg-white" /*change song background color*/
                    onClick={() => handleSongClick(song.id)}
                  >
                    <div className="flex items-center space-x-4 min-w-0">
                      <div className="min-w-0">
                        <h3 className="font-semibold truncate">{song.title}</h3>
                        <p className="text-gray-600 truncate">{song.artist}</p>
                        {(song.key || song.tempo) && (
                          <p className="text-gray-500 text-sm mt-1">
                            {song.key && <span>Key: {song.key}</span>}
                            {song.key && song.tempo && " | "}
                            {song.tempo && <span>Tempo: {song.tempo}</span>}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        className="text-blue-500 hover:text-blue-700 p-2 rounded-lg"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditSong(song.id);
                        }}
                      >
                        <Edit className="h-5 w-5" />
                      </button>
                      <button
                        className="text-red-500 hover:text-red-700 p-2 rounded-lg"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteClick(song.id);
                        }}
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                  </Card>
                ))}
              </div>

              {!searchQuery && (
                <div className="flex justify-center items-center mt-6 space-x-4">
                  <button
                    className="px-4 py-2 bg-gray-300 rounded disabled:opacity-50"
                    onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </button>
                  <span>
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    className="px-4 py-2 bg-gray-300 rounded disabled:opacity-50"
                    onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {showDeleteConfirm && (
        <ConfirmationModal
          isOpen={showDeleteConfirm}
          title="Confirm Deletion"
          message="Are you sure you want to delete this song?"
          onConfirm={confirmDelete}
          onCancel={() => setShowDeleteConfirm(false)}
        />
      )}

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
};

export default Songs;
