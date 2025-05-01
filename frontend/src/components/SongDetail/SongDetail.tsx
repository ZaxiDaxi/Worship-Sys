// SongDetail.tsx
import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import AxiosInstance from "@/components/axios";
import { Card } from "@/components/ui/card";
import { Sidebar } from "@/components/Layout/Sidebar";
import { useIsMobile } from "@/hooks/use-mobile";
import { ArrowUpCircle, ArrowDownCircle } from "lucide-react";
import ConfirmationModal from "@/components/ui/ConfirmationModal";
import Toast from "@/components/ui/toast";
import { Header } from "@/components/Layout/Header";
import { TabNotation } from "@/components/GuitarTab/TabNotation";
import EditIcon from "@mui/icons-material/Edit";
import CancelIcon from "@mui/icons-material/Close";
import { IconButton } from "@mui/material";
import EditToolbar from "@/components/reuse/EditToolbar";
import ChordLine from "../reuse/ChordLine";
import GreenButton from "../reuse/GreenButton";          // ✅ NEW
import { isMinorKey } from "../reuse/songUtils";

interface Chord {
  chord: string;
  position: number;
}

export interface LyricLine {
  text: string;
  chords: Chord[];
}

interface Song {
  id: number;
  title: string;
  artist: string;
  image?: string;
  key: string;
  tempo?: string;
  time_signature?: string;
  lyrics: LyricLine[];
  version: number;
  guitar_tab_id?: number | null;
}

export default function SongDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [editMode, setEditMode] = useState(false);
  const [song, setSong] = useState<Song | null>(null);
  const [loading, setLoading] = useState(true);
  const [transposedLyrics, setTransposedLyrics] = useState<LyricLine[] | null>(null);
  const [transposedKey, setTransposedKey] = useState<string | null>(null);
  const [targetKey, setTargetKey] = useState("");
  const [isTransposing, setIsTransposing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editedTitle, setEditedTitle] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [toast, setToast] = useState<{ message: string; type?: "success" | "error" | "info" } | null>(null);

  const [attachedTab, setAttachedTab] = useState<any>(null);
  const [showTabSelectionModal, setShowTabSelectionModal] = useState(false);
  const [availableTabs, setAvailableTabs] = useState<any[]>([]);

  // Undo/Redo states
  const [past, setPast] = useState<LyricLine[][]>([]);
  const [editedLyrics, setEditedLyrics] = useState<LyricLine[]>([]);
  const [future, setFuture] = useState<LyricLine[][]>([]);

  // State to track whether the sidebar is open.
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Record lyrics changes in history for undo/redo
  const updateEditedLyrics = (newLyrics: LyricLine[]) => {
    if (JSON.stringify(newLyrics) === JSON.stringify(editedLyrics)) return;
    setPast((prev) => [...prev, editedLyrics]);
    setEditedLyrics(newLyrics);
    setFuture([]);
  };

  // Undo
  const undoEditedLyrics = () => {
    if (past.length === 0) return;
    const previous = past[past.length - 1];
    setPast((prev) => prev.slice(0, prev.length - 1));
    setFuture((prev) => [editedLyrics, ...prev]);
    setEditedLyrics(previous);
  };

  // Redo
  const redoEditedLyrics = () => {
    if (future.length === 0) return;
    const next = future[0];
    setFuture((prev) => prev.slice(1));
    setPast((prev) => [...prev, editedLyrics]);
    setEditedLyrics(next);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key.toLowerCase() === "z") {
        e.preventDefault();
        undoEditedLyrics();
      } else if (e.ctrlKey && e.key.toLowerCase() === "y") {
        e.preventDefault();
        redoEditedLyrics();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [past, future, editedLyrics]);

  // Fetch song
  useEffect(() => {
    setLoading(true);
    AxiosInstance.get(`songs/${id}/`)
      .then((res) => {
        const data: Song = res.data;
        setSong(data);
        setEditedTitle(data.title);
        setEditedLyrics(data.lyrics);
        setPast([]);
        setFuture([]);

        if (data.guitar_tab_id) {
          AxiosInstance.get(`guitartabs/${data.guitar_tab_id}/`)
            .then((tabRes) => {
              setAttachedTab(tabRes.data);
            })
            .catch((tabErr) => {
              console.error("Error fetching attached guitar tab:", tabErr);
            });
        }
      })
      .catch((err) => {
        console.error("Error fetching song details:", err);
        if (err.response && err.response.status === 401) {
          navigate("/login");
        }
      })
      .finally(() => {
        setLoading(false);
      });
  }, [id, navigate]);

  // Fetch available tabs if needed
  useEffect(() => {
    if (showTabSelectionModal) {
      AxiosInstance.get("guitartabs/")
        .then((response) => {
          setAvailableTabs(response.data.guitartabs || response.data);
        })
        .catch((error) => {
          console.error("Error fetching guitar tabs:", error);
        });
    }
  }, [showTabSelectionModal]);

  // Handle line updates
  const handleLyricChange = (lineIndex: number, text: string, chords: any) => {
    const updated = [...editedLyrics];
    updated[lineIndex] = { text, chords };
    updateEditedLyrics(updated);
  };

  // Transpose logic
  const transposeSong = async (payload: { direction?: "up" | "down"; target_key?: string }) => {
    if (!song) return;
    if (!payload.direction && !payload.target_key) return;
    setIsTransposing(true);
    setTransposedLyrics(null);
    try {
      const response = await AxiosInstance.post(`transpose/${song.id}/`, payload);
      setTransposedLyrics(response.data.transposed_lyrics);
      setTransposedKey(response.data.transposed_key);
    } catch (error) {
      console.error("Error transposing song:", error);
    } finally {
      setIsTransposing(false);
    }
  };

  // Save new version
  const saveNewVersion = async () => {
    if (!song) return;
    setIsSaving(true);
    const finalLyrics = transposedLyrics || editedLyrics;
    const finalKey = transposedKey || song.key;
    try {
      const response = await AxiosInstance.post(`songs/${song.id}/new-version/`, {
        title: editedTitle,
        artist: song.artist,
        key: finalKey,
        tempo: song.tempo,
        time_signature: song.time_signature,
        lyrics: finalLyrics,
        guitar_tab_id: attachedTab ? attachedTab.id : null,
      });
      setSong(response.data);
      setEditedTitle(response.data.title);
      setEditedLyrics(response.data.lyrics);
      setPast([]);
      setFuture([]);
      setToast({ message: "New version saved successfully", type: "success" });
    } catch (err) {
      console.error("Error saving new version:", err);
      setToast({ message: "Error saving new version", type: "error" });
    } finally {
      setIsSaving(false);
    }
  };

  // Update song
  const updateSong = async () => {
    if (!song) return;
    setIsSaving(true);
    const finalLyrics = transposedLyrics || editedLyrics;
    const finalKey = transposedKey || song.key;
    try {
      const response = await AxiosInstance.put(`songs/${song.id}/`, {
        title: editedTitle,
        artist: song.artist,
        key: finalKey,
        tempo: song.tempo,
        time_signature: song.time_signature,
        lyrics: finalLyrics,
        guitar_tab_id: attachedTab ? attachedTab.id : null,
      });
      setSong(response.data);
      setEditedLyrics(response.data.lyrics);
      setPast([]);
      setFuture([]);
      setToast({ message: "Song updated successfully", type: "success" });
    } catch (err) {
      console.error("Error updating song:", err);
      setToast({ message: "Error updating song", type: "error" });
    } finally {
      setIsSaving(false);
    }
  };

  // Delete song
  const handleDeleteSong = () => {
    setShowDeleteConfirm(true);
  };
  const confirmDelete = async () => {
    if (!song) return;
    try {
      await AxiosInstance.delete(`songs/${song.id}/`);
      setToast({ message: "Song deleted successfully", type: "success" });
      setShowDeleteConfirm(false);
      setTimeout(() => {
        navigate("/songs");
      }, 1500);
    } catch (error) {
      console.error("Error deleting song:", error);
      setToast({ message: "Error deleting song", type: "error" });
      setShowDeleteConfirm(false);
    }
  };

  // Key dropdown
  const handleKeyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const chosenKey = e.target.value;
    setTargetKey(chosenKey);
    if (chosenKey) {
      transposeSong({ target_key: chosenKey });
    }
  };

  // Add new line
  const addLine = () => {
    updateEditedLyrics([...editedLyrics, { text: "", chords: [{ chord: "", position: 0 }] }]);
  };
  /** NEW — insert a blank line **above** the given index */
  const insertLineAt = (idx: number) => {
    const copy = [...editedLyrics];
    copy.splice(idx, 0, { text: "", chords: [{ chord: "", position: 0 }] });
    updateEditedLyrics(copy);
  };

  if (loading) return <div>Loading song details...</div>;
  if (!song) return <div>Song not found</div>;

  const MAJOR_KEYS = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
  const MINOR_KEYS = MAJOR_KEYS.map((k) => k + "m");
  const keysToDisplay = isMinorKey(song.key) ? MINOR_KEYS : MAJOR_KEYS;
  const displayLyrics = transposedLyrics || editedLyrics;

  return (
    <div className="relative flex min-h-screen bg-white md:bg-[#EFF1F7]">
      <Sidebar onToggle={(open) => setSidebarOpen(open)} />
      <div className="flex-1 transition-all duration-300">
        <div className="md:block">
          <Header />
        </div>
        <div className="p-6 bg-white w-full">
          {/* Song title and artist */}
          <div className="mb-4">
            {editMode ? (
              <input
                type="text"
                className="border border-gray-300 p-2 rounded w-full text-xl md:text-2xl lg:text-3xl font-bold mb-2"
                value={editedTitle}
                onChange={(e) => setEditedTitle(e.target.value)}
              />
            ) : (
              <h1 className="text-xl md:text-2xl lg:text-3xl font-bold pt-0">{song.title}</h1>
            )}
            <p className="text-gray-600 text-base lg:text-lg mb-0">By {song.artist}</p>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
            <div className="flex items-center gap-4">
              <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full">
                Key: {transposedKey || song.key}
              </span>
              {song.tempo && (
                <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full">
                  Tempo: {song.tempo}
                </span>
              )}
              {song.time_signature && (
                <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full">
                  Time: {song.time_signature}
                </span>
              )}
            </div>
            <div className="flex items-center gap-4">
              <div className="bg-white rounded-lg p-1 flex items-center gap-2 shadow-sm border border-gray-200">
                <button
                  onClick={() => transposeSong({ direction: "up" })}
                  disabled={isTransposing}
                  className="p-1 rounded-lg hover:bg-purple-50 text-purple-600 transition-colors duration-200 disabled:opacity-50"
                  title="Transpose Up"
                >
                  <ArrowUpCircle className="h-5 w-5" />
                </button>
                
                <select
                  value={targetKey}
                  onChange={handleKeyChange}
                  className="px-2 py-1 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500 text-base lg:text-lg"
                >
                  <option value="">Select Key</option>
                  {keysToDisplay.map((k) => (
                    <option key={k} value={k}>
                      {k}
                    </option>
                  ))}
                </select>
                <button
                  onClick={() => transposeSong({ direction: "down" })}
                  disabled={isTransposing}
                  className="p-1 rounded-lg hover:bg-purple-50 text-purple-600 transition-colors duration-200 disabled:opacity-50"
                  title="Transpose Down"
                >
                  <ArrowDownCircle className="h-5 w-5" />
                </button>
              </div>

              {!editMode ? (
                <IconButton
                  onClick={() => setEditMode(true)}
                  title="Edit"
                  sx={{
                    backgroundColor: "#16BBE5",
                    color: "#fff",
                    borderRadius: "50%",
                    "&:hover": { backgroundColor: "#0d99c0" },
                    width: { sm: 40 },
                    height: { sm: 40 },
                  }}
                >
                  <EditIcon sx={{ fontSize: { sm: 24 } }} />
                </IconButton>
              ) : (
                <IconButton
                  onClick={() => setEditMode(false)}
                  title="Cancel Edit"
                  sx={{
                    backgroundColor: "#E53E3E",
                    color: "#fff",
                    borderRadius: "50%",
                    "&:hover": { backgroundColor: "#c53030" },
                    width: { sm: 40 },
                    height: { sm: 40 },
                  }}
                >
                  <CancelIcon sx={{ fontSize: { sm: 24 } }} />
                </IconButton>
              )}
            </div>
          </div>

          {/* Lyrics Section */}
          <div className="flex flex-col gap-6 mt-4">
            <div className="w-full">
              <div className="space-y-6">
                {displayLyrics.map((line, i) => (
                  <div key={i} className="space-y-2">
                    <ChordLine
                      line={line}
                      editable={editMode}
                      onChange={(newText, newChords) => handleLyricChange(i, newText, newChords)}
                    />
                    {editMode && (
                      <GreenButton
                      label="+ Add Line"
                      onClick={() => insertLineAt(i + 1)}
                      size="small"        // MUI’s built-in reduction
                      color="inherit"
                      startIcon={null}
                      sx={{
                        mt: 1,            // keep your margin-top
                        fontSize: "0.7rem",
                        padding: "2px 8px",   // tighten height & width
                        lineHeight: 1.2,        // keep text vertically centred
                        minWidth: "unset"     // drop MUI’s default 64 px width
                      }}
                    />
                    )}
                  </div>
                ))}
              </div>
            </div>
            {/* Attach Guitar Tab button only appears in edit mode */}
            {editMode && (
              <button
                onClick={() => setShowTabSelectionModal(true)}
                className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded-lg transition-colors duration-200 text-sm md:text-base lg:text-lg"
              >
                Attach Guitar Tab
              </button>
            )}

            {/* Attached Tab */}
            <div className="w-full max-w-5xl mx-auto border border-gray-200 p-4 rounded bg-white flex items-center justify-center">
              {attachedTab && (
                <Card className="bg-white w-full max-w-4xl mx-auto my-4 p-6">
                  <div className="space-y-4">
                    {attachedTab.tab_data && attachedTab.tab_data.lines ? (
                      attachedTab.tab_data.lines.map((l: any, idx: number) => (
                        <div key={idx} className="mb-4 text-2xl">
                          <TabNotation tabData={l} editMode={false} />
                        </div>
                      ))
                    ) : (
                      <p className="text-lg">No tab data available</p>
                    )}
                  </div>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <ConfirmationModal
          isOpen={showDeleteConfirm}
          title="Confirm Deletion"
          message="Are you sure you want to delete this song?"
          onConfirm={confirmDelete}
          onCancel={() => setShowDeleteConfirm(false)}
        />
      )}

      {/* Toast */}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* Guitar Tab Selection Modal */}
      {showTabSelectionModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded shadow-lg w-full max-w-lg">
            <h2 className="text-2xl font-bold mb-4">Select a Guitar Tab</h2>
            <div className="max-h-80 overflow-y-auto">
              {availableTabs.length > 0 ? (
                availableTabs.map((tab) => (
                  <div
                    key={tab.id}
                    className="p-4 border-b cursor-pointer hover:bg-gray-100"
                    onClick={() => {
                      setAttachedTab(tab);
                      setShowTabSelectionModal(false);
                      updateSong();
                    }}
                  >
                    <h3 className="font-semibold">{tab.title}</h3>
                    <p className="text-gray-600">{tab.artist}</p>
                  </div>
                ))
              ) : (
                <p>No guitar tabs available</p>
              )}
            </div>
            <div className="mt-4 flex justify-end">
              <button
                onClick={() => setShowTabSelectionModal(false)}
                className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Edit Toolbar */}
      {editMode && (
        <EditToolbar
          onUndo={undoEditedLyrics}
          onRedo={redoEditedLyrics}
          onSave={saveNewVersion}
          onSaveNew={updateSong}
          onAdd={addLine}
          isSidebarOpen={sidebarOpen}
        />
      )}
    </div>
  );
}
