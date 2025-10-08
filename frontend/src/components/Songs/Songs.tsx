import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AxiosInstance from "@/components/axios/axios";
import { Sidebar } from "@/components/Layout/Sidebar";
import ConfirmationModal from "@/components/ui/ConfirmationModal";
import Toast from "@/components/ui/toast";
import { Header } from "@/components/Layout/Header";
import SongCard from "./SongCard";
import Pagination from "./Pagination";
import SearchBar from "../reuse/SearchBar";

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
  const [toast, setToast] = useState<{ message: string; type?: "success" | "error" | "info" } | null>(null);

  // If user is searching, set a larger pageSize.
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

  const handleSearchSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSearchQuery(searchInput);
  };

  return (
    <div className="relative flex min-h-screen bg-white md:bg-white">
      <Sidebar />
      <div className="flex-1 transition-all duration-300">
        <div className="md:block">
          <Header />
        </div>
        <div className="p-6">
          <div className="flex flex-col md:flex-row justify-between items-center mb-6 pt-4 md:pt-0 lg:md-0">
            <h2 className="text-2xl font-bold mb-4 md:mb-0">Songs List</h2>
            <SearchBar
              searchInput={searchInput}
              onSearchInputChange={setSearchInput}
              onSubmit={handleSearchSubmit}
            />
          </div>
          {loading ? (
            <p>Loading songs...</p>
          ) : (
            <>
              <div className="space-y-4">
                {songs.map((song) => (
                  <SongCard
                    key={song.id}
                    song={song}
                    onEdit={handleEditSong}
                    onDelete={handleDeleteClick}
                    onClick={handleSongClick}
                  />
                ))}
              </div>
              {!searchQuery && (
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPrevious={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                  onNext={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                />
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
