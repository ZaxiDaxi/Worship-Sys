import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { Sidebar } from "@/components/Layout/Sidebar";
import { useIsMobile } from "@/hooks/use-mobile";
import { Edit, Trash2, Search } from "lucide-react";
import AxiosInstance from "@/components/axios";
import ConfirmationModal from "@/components/ui/ConfirmationModal";
import Toast from "@/components/ui/toast";
import { Header } from "@/components/Layout/Header"; // Added global Header

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
  const isMobile = useIsMobile();
  const [guitarTabs, setGuitarTabs] = useState<GuitarTab[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const defaultPageSize = 5;
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedTabId, setSelectedTabId] = useState<number | null>(null);
  const [toast, setToast] = useState<{ message: string; type?: "success" | "error" | "info" } | null>(null);

  // Removed image_url from new tab data since photos are no longer needed.
  const [newTabData, setNewTabData] = useState({
    title: "",
    artist: "",
    key: "",
    tempo: ""
  });
  const [showCreateModal, setShowCreateModal] = useState(false);

  const pageSize = searchQuery ? 1000 : defaultPageSize;

  useEffect(() => {
    setLoading(true);
    AxiosInstance.get("guitartabs/", { 
      params: { 
        page: currentPage, 
        page_size: pageSize, 
        search: searchQuery
      } 
    })
      .then((response) => {
        console.log("Guitar tabs response:", response.data);
        setGuitarTabs(response.data.guitartabs || response.data);
        setTotal(response.data.total || response.data.length);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching guitar tabs:", error);
        setLoading(false);
      });
  }, [currentPage, searchQuery, pageSize]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const totalPages = Math.ceil(total / defaultPageSize);

  const handleEditTab = (tabId: number) => {
    navigate(`/guitar-tabs/${tabId}`);
  };

  const handleDeleteClick = (tabId: number) => {
    setSelectedTabId(tabId);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (selectedTabId === null) return;
    try {
      await AxiosInstance.delete(`guitartabs/${selectedTabId}/`);
      setGuitarTabs(guitarTabs.filter((tab) => tab.id !== selectedTabId));
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

  const handleTabClick = (tabId: number) => {
    navigate(`/guitar-tabs/${tabId}`);
  };

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
      setGuitarTabs([...guitarTabs, response.data]);
      setToast({ message: "Guitar tab created successfully", type: "success" });
      setShowCreateModal(false);
      setNewTabData({
        title: "",
        artist: "",
        key: "",
        tempo: ""
      });
    } catch (error) {
      console.error("Error creating guitar tab:", error);
      setToast({ message: "Error creating guitar tab", type: "error" });
    }
  };

  return (
    <div className="relative flex min-h-screen bg-[#EFF1F7]">
      <Sidebar />
      <div className={`flex-1 transition-all duration-300 ${isMobile ? "ml-0" : "md:ml-64"}`}>
        <Header /> {/* Global Header */}
        <div className="p-6">
          <div className="flex flex-col md:flex-row justify-between items-center mb-6">
            <h2 className="text-2xl font-bold mb-4 md:mb-0">Guitar Tabs List</h2>
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
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center"
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
                        {/* Removed image element */}
                        <div className="min-w-0">
                          <h3 className="font-semibold truncate">{tab.title}</h3>
                          <p className="text-gray-600 truncate">{tab.artist}</p>
                          {tab.key && <p className="text-gray-600 truncate">Key: {tab.key}</p>}
                          {tab.tempo && <p className="text-gray-600 truncate">Tempo: {tab.tempo}</p>}
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
              {(!searchQuery && totalPages > 1) && (
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
              <div className="mt-6">
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                >
                  Create Your First Guitar Tab
                </button>
              </div>
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
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      
      {/* Create Tab Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded shadow-lg w-full max-w-md">
            <h2 className="text-2xl mb-4">Create Guitar Tab</h2>
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Title"
                value={newTabData.title}
                onChange={(e) => setNewTabData({ ...newTabData, title: e.target.value })}
                className="w-full px-4 py-2 border rounded"
              />
              <input
                type="text"
                placeholder="Artist"
                value={newTabData.artist}
                onChange={(e) => setNewTabData({ ...newTabData, artist: e.target.value })}
                className="w-full px-4 py-2 border rounded"
              />
              <input
                type="text"
                placeholder="Key"
                value={newTabData.key}
                onChange={(e) => setNewTabData({ ...newTabData, key: e.target.value })}
                className="w-full px-4 py-2 border rounded"
              />
              <input
                type="text"
                placeholder="Tempo"
                value={newTabData.tempo}
                onChange={(e) => setNewTabData({ ...newTabData, tempo: e.target.value })}
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
