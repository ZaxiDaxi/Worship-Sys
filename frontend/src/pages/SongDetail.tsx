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
import AddCircleIcon from "@mui/icons-material/AddCircle";
import { IconButton } from "@mui/material";
import EditToolbar from "./EditToolbar"; 


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

function isMinorKey(k: string) {
  return k.endsWith("m");
}

// Splits a line of text into tokens, each with a starting index
function splitLineByWordsWithIndex(text: string) {
  const regex = /(\S+|\s+)/g;
  const tokens: Array<{ token: string; start: number }> = [];
  let match;
  let currentIndex = 0;
  while ((match = regex.exec(text)) !== null) {
    const tokenText = match[0];
    tokens.push({ token: tokenText, start: currentIndex });
    currentIndex += tokenText.length;
  }
  return tokens;
}

// A single line of lyrics + chord positions
const ChordLine: React.FC<{
  line: LyricLine;
  editable: boolean;
  onChange?: (text: string, chords: Chord[]) => void;
}> = ({ line, editable, onChange }) => {
  const [text, setText] = useState(line.text);
  const [chords, setChords] = useState<Chord[]>(line.chords);
  const isMobile = useIsMobile();

  // Ref for auto-resizing the textarea
  const textAreaRef = useRef<HTMLTextAreaElement>(null);

  // Reset local state when line prop changes
  useEffect(() => {
    setText(line.text);
    setChords(line.chords);
  }, [line]);

  // Auto-resize the textarea whenever text changes in edit mode
  useEffect(() => {
    if (editable && textAreaRef.current) {
      textAreaRef.current.style.height = "auto";
      textAreaRef.current.style.height = textAreaRef.current.scrollHeight + "px";
    }
  }, [editable, text]);

  // Handle text changes, shifting chord positions accordingly
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value;
    const positionShift = newText.length - text.length;
    const updatedChords = chords.map((c) => ({
      ...c,
      position: Math.max(0, c.position + positionShift),
    }));
    setText(newText);
    setChords(updatedChords);
    onChange?.(newText, updatedChords);
  };

  // Handle chord or chord position changes
  const handleChordChange = (
    index: number,
    field: "chord" | "position",
    value: string | number
  ) => {
    const updated = [...chords];
    if (field === "chord") {
      updated[index].chord = value as string;
    } else {
      const pos = Math.max(0, Math.min(text.length, Number(value)));
      updated[index].position = pos;
    }
    setChords(updated);
    onChange?.(text, updated);
  };

  // Add a new chord at position 0
  const addChord = () => {
    const newChords = [...chords, { chord: "", position: 0 }];
    setChords(newChords);
    onChange?.(text, newChords);
  };

  // VIEW MODE (not editable)
  if (!editable) {
    const tokens = splitLineByWordsWithIndex(text);
    return (
      <div
        className="font-mono text-sm md:text-base leading-[2.5] md:leading-[3.4] flex flex-wrap"
        style={{ marginBottom: "0.5rem" }}
      >
        {tokens.map((tokenObj, i) => {
          const tokenChords = chords.filter(
            (c) =>
              c.position >= tokenObj.start &&
              c.position < tokenObj.start + tokenObj.token.length
          );
          return (
            <span key={i} className="relative inline-block whitespace-pre" style={{ marginRight: "4px" }}>
              {tokenChords.map((chord, chordIdx) => {
                const relIndex = chord.position - tokenObj.start;
                return (
                  <span
                    key={chordIdx}
                    className="absolute text-blue-600 text-sm md:text-base"
                    style={{
                      left: `${relIndex}ch`,
                      top: isMobile ? "-0.9em" : "-1.1em",
                    }}
                  >
                    {chord.chord}
                  </span>
                );
              })}
              <span>{tokenObj.token}</span>
            </span>
          );
        })}
      </div>
    );
  }

  // EDIT MODE (with overlay)
  const tokens = splitLineByWordsWithIndex(text);
  return (
    <div className="relative space-y-8 w-full">
      <div className="text-gray-800 font-mono border border-gray-300 p-1 rounded w-full text-sm md:text-base">
        {/* Resizable Textarea */}
        <textarea
          ref={textAreaRef}
          value={text}
          onChange={handleTextChange}
          maxLength={300}
          rows={3}
          className="w-full min-h-[100px] max-h-[300px] text-sm md:text-base font-mono border-none outline-none rounded px-2 pt-2 text-transparent bg-transparent caret-black leading-[2.5] md:leading-[3.4] whitespace-pre-wrap resize-none overflow-hidden"
          style={{ lineHeight: "normal" }}
        />
        {/* Chord Overlay */}
        <div className="absolute top-2 left-2 w-full h-full pointer-events-none font-mono text-sm md:text-base leading-[2.5] md:leading-[3.4] whitespace-pre-wrap">
          {tokens.map((tokenObj, i) => {
            const tokenChords = chords.filter(
              (c) =>
                c.position >= tokenObj.start &&
                c.position < tokenObj.start + tokenObj.token.length
            );
            return (
              <span key={i} className="relative inline-block whitespace-pre" style={{ marginRight: "4px" }}>
                {tokenChords.map((c, chordIdx) => {
                  const relIndex = c.position - tokenObj.start;
                  return (
                    <span
                      key={chordIdx}
                      className="absolute text-blue-600"
                      style={{
                        left: `${relIndex}ch`,
                        top: "-1.2em",
                      }}
                    >
                      {c.chord}
                    </span>
                  );
                })}
                <span>{tokenObj.token}</span>
              </span>
            );
          })}
        </div>
      </div>

      {/* Chord editing controls */}
      <div className="flex flex-col mt-2 space-y-2">
        {chords.map((c, idx) => (
          <div key={idx} className="flex flex-wrap gap-2 items-center">
            <div className="flex items-center border border-gray-300 rounded px-2 py-1">
              <input
                type="text"
                className="border p-1 rounded w-24 text-sm md:text-base"
                value={c.chord}
                onChange={(e) => handleChordChange(idx, "chord", e.target.value)}
              />
              <input
                type="number"
                className="border p-1 rounded w-20 text-sm md:text-base"
                value={c.position}
                onChange={(e) => handleChordChange(idx, "position", e.target.value)}
              />
            </div>
            {idx === chords.length - 1 && (
              <IconButton onClick={addChord} sx={{ color: "black", p: 0.5 }}>
                <AddCircleIcon sx={{ width: 24, height: 24 }} />
              </IconButton>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

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

  // States for attaching a guitar tab
  const [attachedTab, setAttachedTab] = useState<any>(null);
  const [showTabSelectionModal, setShowTabSelectionModal] = useState(false);
  const [availableTabs, setAvailableTabs] = useState<any[]>([]);

  // Undo/Redo states for editedLyrics
  const [past, setPast] = useState<LyricLine[][]>([]);
  const [editedLyrics, setEditedLyrics] = useState<LyricLine[]>([]);
  const [future, setFuture] = useState<LyricLine[][]>([]);

  // Function to update lyrics (records history) when user makes a change
  const updateEditedLyrics = (newLyrics: LyricLine[]) => {
    // Only update if there is an actual change
    if (JSON.stringify(newLyrics) === JSON.stringify(editedLyrics)) return;
    setPast((prev) => [...prev, editedLyrics]);
    setEditedLyrics(newLyrics);
    setFuture([]);
  };

  // Undo function
  const undoEditedLyrics = () => {
    if (past.length === 0) return;
    const previous = past[past.length - 1];
    setPast((prev) => prev.slice(0, prev.length - 1));
    setFuture((prev) => [editedLyrics, ...prev]);
    setEditedLyrics(previous);
  };

  // Redo function
  const redoEditedLyrics = () => {
    if (future.length === 0) return;
    const next = future[0];
    setFuture((prev) => prev.slice(1));
    setPast((prev) => [...prev, editedLyrics]);
    setEditedLyrics(next);
  };

  // Global keyboard listener for undo/redo (ctrl+z / ctrl+y)
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

  // Fetch song details and initialize editedLyrics state without recording history
  useEffect(() => {
    setLoading(true);
    AxiosInstance.get(`songs/${id}/`)
      .then((res) => {
        const data: Song = res.data;
        setSong(data);
        setEditedTitle(data.title);
        // Directly set the lyrics without pushing the initial empty state to history
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

  // Fetch available guitar tabs if modal is shown
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

  // Handle line text/chord changes and update undo/redo state
  const handleLyricChange = (index: number, text: string, chords: Chord[]) => {
    const updated = [...editedLyrics];
    updated[index] = { text, chords };
    updateEditedLyrics(updated);
  };

  // Transpose the song
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

  // Save new version of the song
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
      // Reset history after saving
      setPast([]);
      setFuture([]);
      setEditedLyrics(response.data.lyrics);
      setToast({ message: "New version saved successfully", type: "success" });
    } catch (err) {
      console.error("Error saving new version:", err);
      setToast({ message: "Error saving new version", type: "error" });
    } finally {
      setIsSaving(false);
    }
  };

  // Update existing song
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
      // Reset history after updating
      setPast([]);
      setFuture([]);
      setEditedLyrics(response.data.lyrics);
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

  // Handle key change for transposition
  const handleKeyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const chosenKey = e.target.value;
    setTargetKey(chosenKey);
    if (chosenKey) {
      transposeSong({ target_key: chosenKey });
    }
  };

  // Add a new blank lyric line
  const addLine = () => {
    updateEditedLyrics([
      ...editedLyrics,
      { text: "", chords: [{ chord: "", position: 0 }] },
    ]);
  };

  if (loading) return <div>Loading song details...</div>;
  if (!song) return <div>Song not found</div>;

  // Key arrays for transposition
  const MAJOR_KEYS = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
  const MINOR_KEYS = MAJOR_KEYS.map((k) => k + "m");
  const keysToDisplay = isMinorKey(song.key) ? MINOR_KEYS : MAJOR_KEYS;

  // Display transposed lyrics if available; otherwise, show edited lyrics
  const displayLyrics = transposedLyrics || editedLyrics;

  return (
    <div className="relative flex min-h-screen bg-white md:bg-[#EFF1F7]">
      <Sidebar />
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

          {/* Row with Key/Tempo and Transpose/Edit controls */}
          <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
            {/* Left side: Key, Tempo, Time Signature */}
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

            {/* Right side: Transpose Controls & Edit button */}
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

              {/* Edit Toggle Button */}
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
                  <ChordLine
                    key={i}
                    line={line}
                    editable={editMode}
                    onChange={(text, chords) => handleLyricChange(i, text, chords)}
                  />
                ))}
              </div>
            </div>

            {/* Attached Tab */}
            <div className="w-full max-w-5xl mx-auto border border-gray-200 p-4 rounded bg-white flex items-center justify-center">
              {attachedTab && (
                <Card className="bg-white w-full max-w-4xl mx-auto my-4 p-6">
                  <div className="space-y-4">
                    {attachedTab.tab_data && attachedTab.tab_data.lines ? (
                      attachedTab.tab_data.lines.map((line: any, idx: number) => (
                        <div key={idx} className="mb-4 text-2xl">
                          <TabNotation tabData={line} editMode={false} />
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

      {/* Toast Notifications */}
      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}

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

      {/* Floating Edit Toolbar when in edit mode */}
      {editMode && (
        <EditToolbar
          onUndo={undoEditedLyrics}
          onRedo={redoEditedLyrics}
          onSave={saveNewVersion}
          onSaveNew={updateSong}
          onAdd={addLine}
        />
      )}
    </div>
  );
}
