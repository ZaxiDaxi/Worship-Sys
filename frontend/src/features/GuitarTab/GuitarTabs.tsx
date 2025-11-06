import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { Sidebar } from "@/features/Layout/Sidebar";
import { Edit, Trash2, Search } from "lucide-react";
import AxiosInstance from "@/api/axios";
import ConfirmationModal from "@/components/ui/ConfirmationModal";
import Toast from "@/components/ui/toast";
import { Header } from "@/features/Layout/Header";
import Button from "@mui/material/Button";
import MusicNoteIcon from "@mui/icons-material/MusicNote";
import GreenButton from "@/components/shared/GreenButton"; 

interface GuitarTab {
  id: number;
  title: string;
  artist: string;
  key?: string;
  tempo?: string;
  tab_data: any;
}

const GuitarTabs: React.FC = () => {
  const navigate = useNavigate();

  // State for the guitar tabs
  const [guitarTabs, setGuitarTabs] = useState<GuitarTab[]>([]);
  const [loading, setLoading] = useState(true);

  // State for total items, current page, page size, etc.
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const defaultPageSize = 5;

  // State for searching
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  // State for delete confirmation
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedTabId, setSelectedTabId] = useState<number | null>(null);

  // State for toast notifications
  const [toast, setToast] = useState<{
    message: string;
    type?: "success" | "error" | "info";
  } | null>(null);

  // State for creating a new guitar tab
  const [newTabData, setNewTabData] = useState({
    title: "",
    artist: "",
    key: "",
    tempo: "",
  });
  const [showCreateModal, setShowCreateModal] = useState(false);

  // If user is searching, use a large pageSize
  const pageSize = searchQuery ? 1000 : defaultPageSize;

  // Fetch guitar tabs from the backend
  useEffect(() => {
    setLoading(true);
    AxiosInstance.get("guitartabs/", {
      params: {
        page: currentPage,
        page_size: pageSize,
        search: searchQuery,
      },
    })
      .then((response) => {
        const data = response.data;
        const tabs = Array.isArray(data) ? data : data.guitartabs || [];
        const totalItems =
          data.total ?? (Array.isArray(data) ? data.length : 0);

        setGuitarTabs(tabs);
        setTotal(totalItems);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching guitar tabs:", error);
        setLoading(false);
      });
  }, [currentPage, searchQuery, pageSize]);

  // Reset to page 1 whenever searchQuery changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  // Calculate total pages based on the defaultPageSize
  const totalPages = Math.ceil(total / defaultPageSize);

  // Handle edit
  const handleEditTab = (tabId: number) => {
    navigate(`/guitar-tabs/${tabId}`);
  };

  // Handle delete
  const handleDeleteClick = (tabId: number) => {
    setSelectedTabId(tabId);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (selectedTabId === null) return;
    try {
      await AxiosInstance.delete(`guitartabs/${selectedTabId}/`);
      setGuitarTabs((prev) => prev.filter((tab) => tab.id !== selectedTabId));
      setToast({ message: "Guitar tab deleted successfully", type: "success" });
      setShowDeleteConfirm(false);
      setSelectedTabId(null);
    } catch (error) {
      console.error("Error deleting guitar tab:", error);
      setToast({ message: "Error deleting guitar tab", type: "error" });
      setShowDeleteConfirm(false);
      setSelectedTabId(null);
    }
  };

  // Handle click on a tab (navigate to detail)
  const handleTabClick = (tabId: number) => {
    navigate(`/guitar-tabs/${tabId}`);
  };

  // Handle create
  const handleCreateTab = async () => {
    const payload = {
      ...newTabData,
      tab_data: {
        strings: [
          { string: 1, notes: [{ fret: 1, position: 1 }] },
          { string: 2, notes: [] },
          { string: 3, notes: [] },
          { string: 4, notes: [] },
          { string: 5, notes: [] },
          { string: 6, notes: [] },
        ],
      },
    };
    try {
      const response = await AxiosInstance.post("guitartabs/create/", payload);
      setGuitarTabs((prev) => [...prev, response.data]);
      setToast({ message: "Guitar tab created successfully", type: "success" });
      setShowCreateModal(false);
      setNewTabData({
        title: "",
        artist: "",
        key: "",
        tempo: "",
      });
    } catch (error) {
      console.error("Error creating guitar tab:", error);
      setToast({ message: "Error creating guitar tab", type: "error" });
    }
  };

  return (
    <div className="relative flex min-h-screen bg-white">
      <Sidebar />
      <div className="flex-1 transition-all duration-300">
        <div className=" md:block">
          <Header />
        </div>

        <div className="p-6">
          <div className="flex flex-col md:flex-row justify-center items-center mb-6">
            <h2 className="text-2xl font-bold mb-4 md:mb-0">
              Guitar Tabs List
            </h2>
          </div>
          {/* Updated container with responsive layout and gap */}
          <div className="my-6 flex flex-col md:flex-row gap-4 items-center justify-between">
            <div>
            <GreenButton onClick={() => setShowCreateModal(true)} />
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                setSearchQuery(searchInput);
              }}
              className="flex items-center max-w-md bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm"
            >
              <input
                type="text"
                placeholder="Search guitar tabs..."
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

          {loading ? (
            <p>Loading guitar tabs...</p>
          ) : (
            <>
              <div className="space-y-4">
                {guitarTabs.length > 0 ? (
                  guitarTabs.map((tab) => (
                    <Card
                      key={tab.id}
                      className="p-4 flex justify-between items-center hover:bg-gray-50 cursor-pointer"
                      onClick={() => handleTabClick(tab.id)}
                    >
                      <div className="flex items-center space-x-4 min-w-0">
                        <div className="min-w-0">
                          <h3 className="font-semibold truncate">
                            {tab.title}
                          </h3>
                          <p className="text-gray-600 truncate">{tab.artist}</p>
                          {(tab.key || tab.tempo) && (
                            <p className="text-gray-500 text-sm mt-1">
                              {tab.key && <span>Key: {tab.key}</span>}
                              {tab.key && tab.tempo && " | "}
                              {tab.tempo && <span>Tempo: {tab.tempo}</span>}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          className="text-blue-500 hover:text-blue-700 p-2 rounded-lg"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditTab(tab.id);
                          }}
                        >
                          <Edit className="h-5 w-5" />
                        </button>
                        <button
                          className="text-red-500 hover:text-red-700 p-2 rounded-lg"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteClick(tab.id);
                          }}
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </div>
                    </Card>
                  ))
                ) : (
                  <div className="text-center py-10">
                    <p className="text-gray-500 mb-4">No guitar tabs found</p>
                  </div>
                )}
              </div>

              {!searchQuery && (
                <div className="flex justify-center items-center mt-6 space-x-4">
                  <button
                    className="px-4 py-2 bg-gray-300 rounded disabled:opacity-50"
                    onClick={() =>
                      setCurrentPage((prev) => Math.max(prev - 1, 1))
                    }
                    disabled={currentPage === 1}
                  >
                    Previous
                  </button>
                  <span>
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    className="px-4 py-2 bg-gray-300 rounded disabled:opacity-50"
                    onClick={() =>
                      setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                    }
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
          message="Are you sure you want to delete this guitar tab?"
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

      {showCreateModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded shadow-lg w-full max-w-md">
            <h2 className="text-2xl mb-4">Create Guitar Tab</h2>
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Title"
                value={newTabData.title}
                onChange={(e) =>
                  setNewTabData({ ...newTabData, title: e.target.value })
                }
                className="w-full px-4 py-2 border rounded"
              />
              <input
                type="text"
                placeholder="Artist"
                value={newTabData.artist}
                onChange={(e) =>
                  setNewTabData({ ...newTabData, artist: e.target.value })
                }
                className="w-full px-4 py-2 border rounded"
              />
              <input
                type="text"
                placeholder="Key"
                value={newTabData.key}
                onChange={(e) =>
                  setNewTabData({ ...newTabData, key: e.target.value })
                }
                className="w-full px-4 py-2 border rounded"
              />
              <input
                type="text"
                placeholder="Tempo"
                value={newTabData.tempo}
                onChange={(e) =>
                  setNewTabData({ ...newTabData, tempo: e.target.value })
                }
                className="w-full px-4 py-2 border rounded"
              />
            </div>
            <div className="mt-4 flex justify-end space-x-2">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateTab}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Submit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GuitarTabs;
