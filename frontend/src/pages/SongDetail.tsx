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
import EditToolbar from "./EditToolbar"; // Floating toolbar component

interface Chord {
  chord: string;
  position: number;
}

interface LyricLine {
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

  // When the line prop changes (e.g. switching from one line to another),
  // reset local states.
  useEffect(() => {
    setText(line.text);
    setChords(line.chords);
  }, [line]);

  // Auto-resize the textarea whenever text changes in edit mode
  useEffect(() => {
    if (editable && textAreaRef.current) {
      textAreaRef.current.style.height = "auto";
      textAreaRef.current.style.height =
        textAreaRef.current.scrollHeight + "px";
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

  // --------------------------
  // VIEW MODE (not editable)
  // --------------------------
  if (!editable) {
    const tokens = splitLineByWordsWithIndex(text);
    return (
      <div
        className="font-mono text-sm md:text-base lg:text-md leading-[2.5] md:leading-[3.4] flex flex-wrap"
        style={{ marginBottom: "0.5rem" }}
      >
        {tokens.map((tokenObj, i) => {
          const tokenChords = chords.filter(
            (c) =>
              c.position >= tokenObj.start &&
              c.position < tokenObj.start + tokenObj.token.length
          );
          return (
            <span
              key={i}
              className="relative inline-block whitespace-pre"
              style={{ marginRight: "4px" }}
            >
              {tokenChords.map((chord, chordIdx) => {
                const relIndex = chord.position - tokenObj.start;
                return (
                  <span
                    key={chordIdx}
                    className="absolute text-blue-600 text-sm md:text-base lg:text-md"
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

  // --------------------------
  // EDIT MODE (with overlay)
  // --------------------------
  const tokens = splitLineByWordsWithIndex(text);
  return (
    <div className="relative space-y-8">
      <div className="relative">
        {/* A textarea that grows as the user types, made transparent so the chord overlay is visible */}
        <textarea
          ref={textAreaRef}
          value={text}
          onChange={handleTextChange}
          maxLength={300}
          rows={1}
          className="
            w-full 
            text-sm md:text-base lg:text-lg 
            font-mono 
           
            rounded 
            px-1 py-1 
            text-transparent bg-transparent 
            caret-black 
            leading-[2.5] md:leading-[3.4] 
            whitespace-pre-wrap 
            resize-none 
            overflow-hidden
          "
          style={{ lineHeight: "normal" }}
        />
        {/* Absolutely positioned overlay that displays chords above the text for alignment */}
        <div
          className="
            absolute top-0 left-0 w-full h-full 
            pointer-events-none 
            font-mono 
            text-sm md:text-base lg:text-lg 
            leading-[2.5] md:leading-[3.4] 
            whitespace-pre-wrap
          "
        >
          {tokens.map((tokenObj, i) => {
            const tokenChords = chords.filter(
              (c) =>
                c.position >= tokenObj.start &&
                c.position < tokenObj.start + tokenObj.token.length
            );
            return (
              <span
                key={i}
                className="relative inline-block whitespace-pre"
                style={{ marginRight: "4px" }}
              >
                {tokenChords.map((c, chordIdx) => {
                  const relIndex = c.position - tokenObj.start;
                  return (
                    <span
                      key={chordIdx}
                      className="absolute text-blue-600"
                      style={{
                        left: `${relIndex}ch`,
                        top: "-1.1em", // adjust as needed
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

      {/* Chord editing controls below */}
      <div className="flex flex-col mt-2 space-y-2">
        {chords.map((c, idx) => (
          <div key={idx} className="flex flex-wrap gap-2">
            <div className="flex items-center border border-gray-300 rounded px-2 py-1">
              <input
                type="text"
                className="border p-1 rounded w-24 text-sm md:text-base lg:text-lg"
                value={c.chord}
                onChange={(e) =>
                  handleChordChange(idx, "chord", e.target.value)
                }
              />
              <input
                type="number"
                className="border p-1 rounded w-20 text-sm md:text-base lg:text-lg"
                value={c.position}
                onChange={(e) =>
                  handleChordChange(idx, "position", e.target.value)
                }
              />
              {/* Only show the AddChord button if this is the last chord in the line */}
              {idx === chords.length - 1 && (
                <IconButton onClick={addChord} sx={{ color: "black", p: 0.5 }}>
                  <AddCircleIcon sx={{ width: 24, height: 24 }} />
                </IconButton>
              )}
            </div>
          </div>
        ))}

        {chords.length === 0 && (
          <IconButton onClick={addChord} sx={{ color: "black", p: 0.5 }}>
            <AddCircleIcon sx={{ width: 24, height: 24 }} />
          </IconButton>
        )}
      </div>
    </div>
  );
};

export default function SongDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  const [song, setSong] = useState<Song | null>(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [editedLyrics, setEditedLyrics] = useState<LyricLine[]>([]);
  const [transposedLyrics, setTransposedLyrics] = useState<LyricLine[] | null>(
    null
  );
  const [transposedKey, setTransposedKey] = useState<string | null>(null);
  const [targetKey, setTargetKey] = useState("");
  const [isTransposing, setIsTransposing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editedTitle, setEditedTitle] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    type?: "success" | "error" | "info";
  } | null>(null);

  // States for attaching a guitar tab
  const [attachedTab, setAttachedTab] = useState<any>(null);
  const [showTabSelectionModal, setShowTabSelectionModal] = useState(false);
  const [availableTabs, setAvailableTabs] = useState<any[]>([]);

  // Fetch the song details
  useEffect(() => {
    setLoading(true);
    AxiosInstance.get(`songs/${id}/`)
      .then((res) => {
        const data: Song = res.data;
        setSong(data);
        setEditedTitle(data.title);
        setEditedLyrics(data.lyrics);

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

  // Fetch available guitar tabs if the selection modal is shown
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

  // Handle line text/chord changes in the lyric lines
  const handleLyricChange = (index: number, text: string, chords: Chord[]) => {
    const updated = [...editedLyrics];
    updated[index] = { text, chords };
    setEditedLyrics(updated);
  };

  // Transpose the song up/down or to a target key
  const transposeSong = async (payload: {
    direction?: "up" | "down";
    target_key?: string;
  }) => {
    if (!song) return;
    if (!payload.direction && !payload.target_key) return;
    setIsTransposing(true);
    setTransposedLyrics(null);
    try {
      const response = await AxiosInstance.post(
        `transpose/${song.id}/`,
        payload
      );
      setTransposedLyrics(response.data.transposed_lyrics);
      setTransposedKey(response.data.transposed_key);
    } catch (error) {
      console.error("Error transposing song:", error);
    } finally {
      setIsTransposing(false);
    }
  };

  // Save a new version of the song
  const saveNewVersion = async () => {
    if (!song) return;
    setIsSaving(true);
    const finalLyrics = transposedLyrics || editedLyrics;
    const finalKey = transposedKey || song.key;
    try {
      const response = await AxiosInstance.post(
        `songs/${song.id}/new-version/`,
        {
          title: editedTitle,
          artist: song.artist,
          key: finalKey,
          tempo: song.tempo,
          time_signature: song.time_signature,
          lyrics: finalLyrics,
          guitar_tab_id: attachedTab ? attachedTab.id : null,
        }
      );
      setSong(response.data);
      setEditedTitle(response.data.title);
      setEditedLyrics(response.data.lyrics);
      setToast({ message: "New version saved successfully", type: "success" });
    } catch (err) {
      console.error("Error saving new version:", err);
      setToast({ message: "Error saving new version", type: "error" });
    } finally {
      setIsSaving(false);
    }
  };

  // Update the existing song (not a new version)
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
      setToast({ message: "Song updated successfully", type: "success" });
    } catch (err) {
      console.error("Error updating song:", err);
      setToast({ message: "Error updating song", type: "error" });
    } finally {
      setIsSaving(false);
    }
  };

  // Delete the song
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

  // Transpose to a specific key from the dropdown
  const handleKeyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const chosenKey = e.target.value;
    setTargetKey(chosenKey);
    if (chosenKey) {
      transposeSong({ target_key: chosenKey });
    }
  };

  // Add a blank lyric line
  const addLine = () => {
    setEditedLyrics([...editedLyrics, { text: "", chords: [] }]);
  };

  if (loading) return <div>Loading song details...</div>;
  if (!song) return <div>Song not found</div>;

  // Key arrays for transposition
  const MAJOR_KEYS = [
    "C",
    "C#",
    "D",
    "D#",
    "E",
    "F",
    "F#",
    "G",
    "G#",
    "A",
    "A#",
    "B",
  ];
  const MINOR_KEYS = MAJOR_KEYS.map((k) => k + "m");
  const keysToDisplay = isMinorKey(song.key) ? MINOR_KEYS : MAJOR_KEYS;

  // If we've transposed, show transposed lyrics; otherwise, show the edited ones
  const displayLyrics = transposedLyrics || editedLyrics;

  return (
    <div className="relative flex min-h-screen bg-white md:bg-[#EFF1F7]">
      <Sidebar />
      <div className="flex-1 transition-all duration-300">
        <div className="md:block">
          <Header />
        </div>
        <div className="p-6 bg-white w-full">
          {/* Flex container: column on small screens, row on md+ screens */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
            {/* LEFT SIDE: Title, artist, key/tempo badges */}
            <div>
              {/* Song title or editable input */}
              {editMode ? (
                <input
                  type="text"
                  className="border border-gray-300 p-2 rounded w-full text-xl 
                 md:text-2xl lg:text-3xl font-bold mb-2"
                  value={editedTitle}
                  onChange={(e) => setEditedTitle(e.target.value)}
                />
              ) : (
                <h1 className="text-xl md:text-2xl lg:text-3xl font-bold pt-0">
                  {song.title}
                </h1>
              )}

              {/* Put By {song.artist} and Select Key in the same container */}
              <div className="flex items-center gap-3 mb-4 ">
                <p className="text-gray-600 text-base md:text-lg lg:text-xl mb-0">
                  By {song.artist}
                </p>
                <div
                  className="bg-white rounded-lg p-1 flex items-center gap-2 
                     sm:shadow-sm sm:border sm:border-gray-200"
                >
                  <button
                    onClick={() => transposeSong({ direction: "up" })}
                    disabled={isTransposing}
                    className="p-1 rounded-lg hover:bg-purple-50 text-purple-600 
                     transition-colors duration-200 disabled:opacity-50"
                    title="Transpose Up"
                  >
                    <ArrowUpCircle className="hidden sm:block h-5 w-5" />
                  </button>
                  <select
                    value={targetKey}
                    onChange={handleKeyChange}
                    className="px-2 py-1 rounded-lg border border-gray-200 
                     focus:outline-none focus:ring-2 focus:ring-purple-500
                     text-sm md:text-base lg:text-lg "
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
                    className="p-1 rounded-lg hover:bg-purple-50 text-purple-600 
                     transition-colors duration-200 disabled:opacity-50"
                    title="Transpose Down"
                  >
                    <ArrowDownCircle className="hidden sm:block h-5 w-5" />
                  </button>
                </div>
              </div>

              {/* Badges: Key, Tempo, Time Signature, etc. */}
              <div className="flex flex-wrap gap-4 text-sm md:text-base lg:text-lg">
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
            </div>

            {/* RIGHT SIDE: Transpose controls & Edit button */}
            {/* On larger screens, this stays pinned to the right via `justify-between` above. 
        On small screens, it drops underneath the left content. */}
            <div className="flex flex-col md:flex-row gap-4 items-center mt-4 md:mt-0">
              {/* Transpose controls */}

              {/* Edit toggle button */}
              {!editMode ? (
                <IconButton
                  onClick={() => setEditMode(true)}
                  title="Edit"
                  sx={{
                    backgroundColor: "#16BBE5",
                    color: "#fff",
                    borderRadius: "50%",
                    "&:hover": { backgroundColor: "#0d99c0" },
                    width: { xs: 30, sm: 40 },
                    height: { xs: 30, sm: 40 },
                  }}
                >
                  <EditIcon sx={{ fontSize: { xs: 18, sm: 24 } }} />
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
                    width: { xs: 30, sm: 40 },
                    height: { xs: 30, sm: 40 },
                  }}
                >
                  <CancelIcon sx={{ fontSize: { xs: 18, sm: 24 } }} />
                </IconButton>
              )}
            </div>
          </div>

          {/* Lyrics Section */}
          <div className="flex flex-col gap-6 mt-8">
            <div className="w-full">
              <div className="space-y-6 mt-8">
                {displayLyrics.map((line, i) => (
                  <ChordLine
                    key={i}
                    line={line}
                    editable={editMode}
                    onChange={(text, chords) =>
                      handleLyricChange(i, text, chords)
                    }
                  />
                ))}
                {editMode && (
                  <button
                    type="button"
                    onClick={addLine}
                    className="mt-4 bg-blue-500 text-white px-3 py-1 rounded flex items-center gap-1 text-sm md:text-base lg:text-lg"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 4v16m8-8H4"
                      />
                    </svg>
                    Add New Line
                  </button>
                )}
              </div>
            </div>

            {/* Attached Tab */}
            <div className="w-full max-w-5xl mx-auto border border-gray-200 p-4 rounded bg-white flex items-center justify-center">
              {attachedTab && (
                <Card className="bg-white w-full max-w-4xl mx-auto my-4 p-6">
                  <div className="space-y-4">
                    {attachedTab.tab_data && attachedTab.tab_data.lines ? (
                      attachedTab.tab_data.lines.map(
                        (line: any, idx: number) => (
                          <div key={idx} className="mb-4 text-2xl">
                            <TabNotation tabData={line} editMode={false} />
                          </div>
                        )
                      )
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
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
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

      {/* Floating Edit Toolbar (at bottom-center) when in edit mode */}
      {editMode && (
        <EditToolbar
          onSend={() => alert("Send action")}
          onAddImage={() => alert("Add image action")}
          onCopy={() => alert("Copy action")}
          onComment={() => alert("Comment action")}
          onAdd={() => alert("Add action")}
        />
      )}
    </div>
  );
}
