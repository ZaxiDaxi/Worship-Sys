import React, { useState, useEffect } from "react"; // React core + hooks for local state and side-effects
import { useNavigate } from "react-router-dom"; // Router hook to imperatively navigate to routes
import AxiosInstance from "@/api/axios"; // Preconfigured Axios instance (baseURL/interceptors)
import { Sidebar } from "@/features/Layout/Sidebar"; // App layout: left sidebar
import ConfirmationModal from "@/components/ui/ConfirmationModal"; // Reusable confirm dialog
import Toast from "@/components/ui/toast"; // Simple toast notifications
import { Header } from "@/features/Layout/Header"; // App layout: top header
import SongCard from "./SongCard"; // Card that displays a single song, with Edit/Delete actions
import Pagination from "./Pagination"; // Pager controls (prev/next)
import SearchBar from "@/components/shared/SearchBar"; // Controlled search input + submit form

// --- Types -------------------------------------------------------------------
interface Song {
  id: number;
  title: string;
  artist: string;
  key?: string; // optional music key (e.g., "G", "Am")
  tempo?: string; // optional tempo display (e.g., "72 BPM")
  time_signature?: string; // optional time signature (e.g., "4/4")
}

// --- Component ---------------------------------------------------------------
const Songs: React.FC = () => {
  const navigate = useNavigate(); // imperative navigation (e.g., navigate(`/songs/123`))

  // Data + UI state -----------------------------------------------------------
  const [songs, setSongs] = useState<Song[]>([]); // current page's songs
  const [loading, setLoading] = useState(true); // network/loading flag
  const [total, setTotal] = useState(0); // total number of songs (for pagination)
  const [currentPage, setCurrentPage] = useState(1); // 1-based page index

  const defaultPageSize = 5; // standard page size when not searching

  // Search states: separate input vs committed query to allow debouncing UX
  const [searchInput, setSearchInput] = useState(""); // what user types
  const [searchQuery, setSearchQuery] = useState(""); // what we submit to API

  // Delete confirmation modal state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedSongId, setSelectedSongId] = useState<number | null>(null);

  // Toast notification state
  const [toast, setToast] = useState<{
    message: string;
    type?: "success" | "error" | "info";
  } | null>(null);

  // If a search is active, fetch a lot more rows to effectively disable pagination UI
  const pageSize = searchQuery ? 1000 : defaultPageSize;

  // Fetch songs whenever page, search, or pageSize changes --------------------
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
        // Expecting shape: { songs: Song[], total: number }
        setSongs(response.data.songs);
        setTotal(response.data.total);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching songs:", error);
        setLoading(false);
      });
  }, [currentPage, searchQuery, pageSize]);

  // When search query changes, reset to the first page ------------------------
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  // Derived: total number of pages (based on the *default* page size) ---------
  // Note: pagination UI is hidden entirely during search mode
  const totalPages = Math.ceil(total / defaultPageSize);

  // Handlers ------------------------------------------------------------------
  const handleEditSong = (songId: number) => {
    // Navigate to the song detail/edit page
    navigate(`/songs/${songId}/edit`);
  };

  const handleDeleteClick = (songId: number) => {
    // Open confirm dialog and store which song to delete
    setSelectedSongId(songId);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    // Guard: nothing selected
    if (selectedSongId === null) return;

    try {
      await AxiosInstance.delete(`songs/${selectedSongId}/`);
      setToast({ message: "Song deleted successfully", type: "success" });
      setShowDeleteConfirm(false);
      setSelectedSongId(null);

      // Simple approach: reload to refresh list (could be optimized by updating state)
      window.location.reload();
    } catch (error) {
      console.error("Error deleting song:", error);
      setToast({ message: "Error deleting song", type: "error" });
      setShowDeleteConfirm(false);
      setSelectedSongId(null);
    }
  };

  const handleSongClick = (songId: number) => {
    // Clicking a card navigates to its detail page, same as Edit for now
    navigate(`/songs/${songId}`);
  };

  const handleSearchSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault(); // prevent page reload on form submit

    // Commit the search query (triggers fetch effect + resets page to 1)
    setSearchQuery(searchInput);
  };

  // --- Render ----------------------------------------------------------------
  return (
    <div className="relative flex min-h-screen bg-white md:bg-white">
      {/* Left navigation */}
      <Sidebar />

      {/* Main content column */}
      <div className="flex-1 transition-all duration-300">
        {/* Top header */}
        <div className="md:block">
          <Header />
        </div>

        {/* Content area */}
        <div className="p-6">
          {/* Title row + search */}
          <div className="flex flex-col md:flex-row justify-between items-center mb-6 pt-4 md:pt-0 lg:md-0">
            <h2 className="text-2xl font-bold mb-4 md:mb-0">Songs List</h2>

            {/* Controlled search bar: input value + onChange + onSubmit */}
            <SearchBar
              searchInput={searchInput}
              onSearchInputChange={setSearchInput}
              onSubmit={handleSearchSubmit}
            />
          </div>

          {/* Body: loading vs list + pagination */}
          {loading ? (
            <p>Loading songs...</p>
          ) : (
            <>
              {/* Songs list */}
              <div className="space-y-4">
                {songs.map((song) => (
                  <SongCard
                    key={song.id}
                    song={song}
                    onEdit={handleEditSong} // edit button -> navigate to detail
                    onDelete={handleDeleteClick} // delete button -> open confirm
                    onClick={handleSongClick} // card click -> navigate to detail
                  />
                ))}
              </div>

              {/* Pagination hidden in search mode */}
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

      {/* Delete confirmation modal */}
      {showDeleteConfirm && (
        <ConfirmationModal
          isOpen={showDeleteConfirm}
          title="Confirm Deletion"
          message="Are you sure you want to delete this song?"
          onConfirm={confirmDelete}
          onCancel={() => setShowDeleteConfirm(false)}
        />
      )}

      {/* Toast notification */}
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

export default Songs; // default export for router/imports
