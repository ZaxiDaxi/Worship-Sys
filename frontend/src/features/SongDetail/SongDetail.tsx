import React, { useState, useEffect } from "react"; // React core and hooks
import { useParams, useNavigate } from "react-router-dom"; // Read :id from URL and navigate programmatically
import AxiosInstance from "@/api/axios"; // Preconfigured Axios (baseURL/interceptors)
import { Card } from "@/components/ui/card"; // UI card wrapper
import { Sidebar } from "@/features/Layout/Sidebar"; // App sidebar
import { useIsMobile } from "@/hooks/use-mobile"; // Custom hook to detect mobile viewport
import { ArrowUpCircle, ArrowDownCircle } from "lucide-react"; // Icons for transpose up/down
import ConfirmationModal from "@/components/ui/ConfirmationModal"; // Reusable confirm modal
import Toast from "@/components/ui/toast"; // Reusable toast notifications
import { Header } from "@/features/Layout/Header"; // App header
import { TabNotation } from "@/features/GuitarTab/TabNotation"; // Component that renders guitar tab lines
import EditIcon from "@mui/icons-material/Edit"; // MUI icons
import CancelIcon from "@mui/icons-material/Close";
import { IconButton } from "@mui/material"; // MUI button container for icons
import EditToolbar from "@/components/shared/EditToolbar"; // Floating toolbar (undo/redo/save)
import ChordLine from "@/components/shared/ChordLine"; // Renders a lyric line with chord positions; editable in edit mode
import GreenButton from "@/components/shared/GreenButton"; // Small helper button component used for "+ Add Line"
import { isMinorKey } from "@/components/shared/songUtils"; // Utility to check if a key is minor (e.g., "Am")

// --- Types -------------------------------------------------------------------
interface Chord {
  chord: string; // chord label, e.g., "Am", "G"
  position: number; // character index in the lyric line where the chord aligns
}

export interface LyricLine {
  text: string; // lyric text for the line
  chords: Chord[]; // list of chords with positions for this line
}

interface Song {
  id: number;
  title: string;
  artist: string;
  image?: string; // optional cover art URL
  key: string; // tonal key (e.g., "C", "Am")
  tempo?: string; // e.g., "70" or "70 bpm"
  time_signature?: string; // e.g., "4/4"
  lyrics: LyricLine[]; // full lyrics as lines with chord overlays
  version: number; // integer version for tracking revisions
  guitar_tab_id?: number | null; // relation to a guitar tab resource
  flow_notes?: string;  // freeform notes about song flow (Verse/Chorus order)
}

// defaultEdit prop allows routing like /songs/:id/edit to open directly in edit mode
export default function SongDetail({ defaultEdit = false }: { defaultEdit?: boolean }) {
  const { id } = useParams(); // read song id from URL (string | undefined)
  const navigate = useNavigate(); // route programmatic navigation
  const isMobile = useIsMobile(); // detect mobile; can be used to tweak UI (unused in current snippet)

  // --- Local state -----------------------------------------------------------
  const [editMode, setEditMode] = useState(defaultEdit); // toggles between read and edit UI
  const [song, setSong] = useState<Song | null>(null); // full song payload
  const [loading, setLoading] = useState(true); // network loading flag

  // Transposition state: if non-null, show transposed lyrics/key instead of base song
  const [transposedLyrics, setTransposedLyrics] = useState<LyricLine[] | null>(null);
  const [transposedKey, setTransposedKey] = useState<string | null>(null);
  const [targetKey, setTargetKey] = useState(""); // selected key from dropdown
  const [isTransposing, setIsTransposing] = useState(false); // button disable while request in-flight

  // Save-state flags and edited fields ---------------------------------------
  const [isSaving, setIsSaving] = useState(false); // disable save buttons while saving
  const [editedTitle, setEditedTitle] = useState(""); // controlled input for title field

  // Delete + toast ------------------------------------------------------------
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [toast, setToast] = useState<{ message: string; type?: "success" | "error" | "info" } | null>(null);

  // Guitar tab linking --------------------------------------------------------
  const [attachedTab, setAttachedTab] = useState<any>(null); // loaded tab payload when song.guitar_tab_id exists
  const [showTabSelectionModal, setShowTabSelectionModal] = useState(false); // open modal to select a tab
  const [availableTabs, setAvailableTabs] = useState<any[]>([]); // list of available tabs to attach

  // Song flow notes -----------------------------------------------------------
  const [flowNotes, setFlowNotes] = useState<string>(
    "Verse → Chorus → Guitar Solo → Chorus" // default placeholder if server has no value
  );

  // Undo/Redo stacks for lyrics editing --------------------------------------
  const [past, setPast] = useState<LyricLine[][]>([]); // history stack (past states)
  const [editedLyrics, setEditedLyrics] = useState<LyricLine[]>([]); // current working lyrics (may diverge from song.lyrics)
  const [future, setFuture] = useState<LyricLine[][]>([]); // redo stack (future states)

  // Track sidebar open to offset floating toolbar if needed ------------------
  const [sidebarOpen, setSidebarOpen] = useState(false);

  /***********************
   * Helpers             *
   ***********************/
  // Centralized lyrics updater that pushes current state to history and clears redo
  const updateEditedLyrics = (newLyrics: LyricLine[]) => {
    // Avoid pushing identical state to history (cheap compare)
    if (JSON.stringify(newLyrics) === JSON.stringify(editedLyrics)) return;
    setPast((prev) => [...prev, editedLyrics]); // push current state to past
    setEditedLyrics(newLyrics); // adopt new lyrics
    setFuture([]); // clear redo stack
  };

  // Undo: pop from past -> current goes to future
  const undoEditedLyrics = () => {
    if (past.length === 0) return;
    const previous = past[past.length - 1];
    setPast((prev) => prev.slice(0, prev.length - 1));
    setFuture((prev) => [editedLyrics, ...prev]);
    setEditedLyrics(previous);
  };

  // Redo: shift from future -> push current to past
  const redoEditedLyrics = () => {
    if (future.length === 0) return;
    const next = future[0];
    setFuture((prev) => prev.slice(1));
    setPast((prev) => [...prev, editedLyrics]);
    setEditedLyrics(next);
  };

  /***********************
   * Effects             *
   ***********************/
  // Keyboard shortcuts: Ctrl+Z (undo) / Ctrl+Y (redo)
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
  }, [past, future, editedLyrics]); // include stacks/editedLyrics to keep closures current

  // Fetch song details on mount and whenever :id changes ----------------------
  useEffect(() => {
    setLoading(true);
    AxiosInstance.get(`songs/${id}/`)
      .then((res) => {
        const data: Song = res.data; // trust backend shape to match Song interface
        setSong(data);
        setEditedTitle(data.title); // seed controlled field
        setEditedLyrics(data.lyrics); // seed editable lyrics state
        setPast([]);
        setFuture([]);
        setFlowNotes(data.flow_notes || ""); // if backend has notes, prefer those

        // If song has a linked guitar tab, fetch its payload
        if (data.guitar_tab_id) {
          AxiosInstance.get(`guitartabs/${data.guitar_tab_id}/`)
            .then((tabRes) => setAttachedTab(tabRes.data))
            .catch((err) => console.error("Error fetching attached guitar tab:", err));
        }
      })
      .catch((err) => {
        console.error("Error fetching song details:", err);
        // If unauthorized, kick to login
        if (err.response && err.response.status === 401) navigate("/login");
      })
      .finally(() => setLoading(false));
  }, [id, navigate]);

  // Fetch list of available tabs when selection modal opens -------------------
  useEffect(() => {
    if (!showTabSelectionModal) return; // guard: only fetch when modal is visible
    AxiosInstance.get("guitartabs/")
      .then((res) => setAvailableTabs(res.data.guitartabs || res.data))
      .catch((err) => console.error("Error fetching guitar tabs:", err));
  }, [showTabSelectionModal]);

  /***********************
   * Event handlers      *
   ***********************/
  // Called by <ChordLine /> when a line changes
  const handleLyricChange = (index: number, text: string, chords: any) => {
    const updated = [...editedLyrics];
    updated[index] = { text, chords };
    updateEditedLyrics(updated);
  };

  // Call backend transpose service: either direction (up/down) or absolute target_key
  const transposeSong = async (payload: { direction?: "up" | "down"; target_key?: string; }) => {
    if (!song) return; // guard: not loaded yet
    if (!payload.direction && !payload.target_key) return; // nothing to do
    setIsTransposing(true);
    setTransposedLyrics(null); // reset old preview
    try {
      const res = await AxiosInstance.post(`transpose/${song.id}/`, payload);
      setTransposedLyrics(res.data.transposed_lyrics); // previewed lyrics
      setTransposedKey(res.data.transposed_key); // previewed key
    } catch (err) {
      console.error("Error transposing song:", err);
    } finally {
      setIsTransposing(false);
    }
  };

  // Create a new version of the song with current edits (server should bump version)
  const saveNewVersion = async () => {
    if (!song) return;
    setIsSaving(true);
    const finalLyrics = transposedLyrics || editedLyrics; // prefer preview if present
    const finalKey = transposedKey || song.key;
    try {
      const res = await AxiosInstance.post(`songs/${song.id}/new-version/`, {
        title: editedTitle,
        artist: song.artist,
        key: finalKey,
        tempo: song.tempo,
        time_signature: song.time_signature,
        lyrics: finalLyrics,
        guitar_tab_id: attachedTab ? attachedTab.id : null,
        flow_notes: flowNotes,
      });
      // Replace local song with server-confirmed payload
      setSong(res.data);
      setEditedTitle(res.data.title);
      setEditedLyrics(res.data.lyrics);
      setFlowNotes(res.data.flow_notes || "");
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

  // Update current version in-place (PUT) -------------------------------------
  const updateSong = async () => {
    if (!song) return;
    setIsSaving(true);
    const finalLyrics = transposedLyrics || editedLyrics;
    const finalKey = transposedKey || song.key;
    try {
      const res = await AxiosInstance.put(`songs/${song.id}/`, {
        title: editedTitle,
        artist: song.artist,
        key: finalKey,
        tempo: song.tempo,
        time_signature: song.time_signature,
        lyrics: finalLyrics,
        guitar_tab_id: attachedTab ? attachedTab.id : null,
        flow_notes: flowNotes,
      });
      setSong(res.data);
      setEditedLyrics(res.data.lyrics);
      setFlowNotes(res.data.flow_notes || "");
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

  // Delete current song; after success, navigate back to list -----------------
  const confirmDelete = async () => {
    if (!song) return;
    try {
      await AxiosInstance.delete(`songs/${song.id}/`);
      setToast({ message: "Song deleted successfully", type: "success" });
      setShowDeleteConfirm(false);
      setTimeout(() => navigate("/songs"), 1500); // soft delay to show toast
    } catch (err) {
      console.error("Error deleting song:", err);
      setToast({ message: "Error deleting song", type: "error" });
      setShowDeleteConfirm(false);
    }
  };

  // Handle target key dropdown change and trigger absolute transposition ------
  const handleKeyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const chosenKey = e.target.value;
    setTargetKey(chosenKey);
    if (chosenKey) transposeSong({ target_key: chosenKey });
  };

  // Insert helpers for editing lyrics ----------------------------------------
  const addLine = () =>
    updateEditedLyrics([
      ...editedLyrics,
      { text: "", chords: [{ chord: "", position: 0 }] },
    ]);

  const insertLineAt = (idx: number) => {
    const copy = [...editedLyrics];
    copy.splice(idx, 0, { text: "", chords: [{ chord: "", position: 0 }] });
    updateEditedLyrics(copy);
  };

  /***********************
   * Render helpers      *
   ***********************/
  if (loading) return <div>Loading song details...</div>; // early return while loading
  if (!song) return <div>Song not found</div>; // early return if id invalid or not found

  // Prepare key dropdown options ---------------------------------------------
  const MAJOR_KEYS = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
  const MINOR_KEYS = MAJOR_KEYS.map((k) => k + "m");
  const keysToDisplay = isMinorKey(song.key) ? MINOR_KEYS : MAJOR_KEYS; // show parallel set based on base key
  const displayLyrics = transposedLyrics || editedLyrics; // pick preview if transposed, else current edits

  // --- Render ----------------------------------------------------------------
  return (
    <div className="relative flex min-h-screen bg-white md:bg-[#EFF1F7]">
      <Sidebar onToggle={(open) => setSidebarOpen(open)} />
      <div className="flex-1 transition-all duration-300">
        <Header />
        <div className="p-6 bg-white w-full">
          {/* Song title & artist */}
          <div className="mb-4">
            {editMode ? (
              // Editable title input in edit mode
              <input
                type="text"
                className="border border-gray-300 p-2 rounded w-full text-xl md:text-2xl lg:text-3xl font-bold mb-2"
                value={editedTitle}
                onChange={(e) => setEditedTitle(e.target.value)}
              />
            ) : (
              // Static title in view mode
              <h1 className="text-xl md:text-2xl lg:text-3xl font-bold pt-0">{song.title}</h1>
            )}
            <p className="text-gray-600 text-base lg:text-lg mb-0">By {song.artist}</p>
          </div>

          {/* Controls: key badges, transpose controls, edit toggle */}
          <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
            {/* Current key/tempo/time labels */}
            <div className="flex items-center gap-4">
              <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full">Key: {transposedKey || song.key}</span>
              {song.tempo && (
                <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full">Tempo: {song.tempo}</span>
              )}
              {song.time_signature && (
                <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full">Time: {song.time_signature}</span>
              )}
            </div>

            {/* Transpose controls + edit toggle button */}
            <div className="flex items-center gap-4">
              <div className="bg-white rounded-lg p-1 flex items-center gap-2 shadow-sm border border-gray-200">
                {/* Transpose up */}
                <button
                  onClick={() => transposeSong({ direction: "up" })}
                  disabled={isTransposing}
                  className="p-1 rounded-lg hover:bg-purple-50 text-purple-600 transition-colors duration-200 disabled:opacity-50"
                  title="Transpose Up"
                >
                  <ArrowUpCircle className="h-5 w-5" />
                </button>

                {/* Absolute target key select */}
                <select
                  value={targetKey}
                  onChange={handleKeyChange}
                  className="px-2 py-1 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500 text-base lg:text-lg"
                >
                  <option value="">Select Key</option>
                  {keysToDisplay.map((k) => (
                    <option key={k} value={k}>{k}</option>
                  ))}
                </select>

                {/* Transpose down */}
                <button
                  onClick={() => transposeSong({ direction: "down" })}
                  disabled={isTransposing}
                  className="p-1 rounded-lg hover:bg-purple-50 text-purple-600 transition-colors duration-200 disabled:opacity-50"
                  title="Transpose Down"
                >
                  <ArrowDownCircle className="h-5 w-5" />
                </button>
              </div>

              {/* Toggle edit mode on/off */}
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

          {/* Lyrics editor/viewer ------------------------------------------------*/}
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
                        size="small"
                        color="inherit"
                        startIcon={null}
                        sx={{ mt: 1, fontSize: "0.7rem", padding: "2px 8px", lineHeight: 1.2, minWidth: "unset" }}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Attach Guitar Tab (only visible in edit mode) */}
            {editMode && (
              <button
                onClick={() => setShowTabSelectionModal(true)}
                className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded-lg transition-colors duration-200 text-sm md:text-base lg:text-lg"
              >
                Attach Guitar Tab
              </button>
            )}

            {/* Song Flow Section ------------------------------------------------*/}
            <div className="w-full border-t border-gray-300 my-6" />
            <p className="text-center uppercase text-sm md:text-xl font-bold">Song Flow</p>

            {/* Flow notes: textarea in edit mode, static block otherwise */}
            {editMode ? (
              <div className="bg-gray-50 border border-dashed">
                <textarea
                  className="w-full p-2 border border-gray-300 rounded text-sm md:text-lg"
                  rows={3}
                  value={flowNotes}
                  onChange={(e) => setFlowNotes(e.target.value)}
                  placeholder="e.g., Verse → Chorus → Guitar Solo → Chorus"
                />
              </div>
            ) : (
              <div className="bg-gray-100 border border-gray-300 rounded-lg p-4 my-4">
                <p className="text-gray-900 whitespace-pre-wrap text-base md:text-lg font-khmer leading-relaxed tracking-wide">
                  {flowNotes}
                </p>
              </div>
            )}
          </div>

          {/* Guitar Tab section -------------------------------------------------*/}
          {attachedTab && (
            <>
              <div className="w-full border-t border-gray-300 my-10" />
              <p className="text-center uppercase tracking-wider text-sm md:text-xl font-bold mb-6">Guitar Tab</p>
            </>
          )}

          {attachedTab && (
            <Card className="bg-white w-full max-w-4xl mx-auto my-4 p-6">
              <div className="space-y-4">
                {attachedTab.tab_data?.lines?.length ? (
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

      {/* Delete Confirmation Modal (opened elsewhere when needed) */}
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
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}

      {/* Modal: pick a guitar tab to attach */}
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
                      setAttachedTab(tab); // choose this tab
                      setShowTabSelectionModal(false);
                      updateSong(); // persist attachment immediately
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
              <button onClick={() => setShowTabSelectionModal(false)} className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Edit Toolbar (only when editing) */}
      {editMode && (
        <EditToolbar
          onUndo={undoEditedLyrics}
          onRedo={redoEditedLyrics}
          onSave={saveNewVersion} // save as a new version (POST /new-version)
          onSaveNew={updateSong}  // update current version (PUT)
          onAdd={addLine}
          isSidebarOpen={sidebarOpen}
        />
      )}
    </div>
  );
}
