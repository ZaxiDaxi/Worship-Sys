import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import AxiosInstance from "@/components/axios"; // Use your custom Axios instance
import { Card } from "@/components/ui/card";
import { Sidebar } from "@/components/Layout/Sidebar";
import { useIsMobile } from "@/hooks/use-mobile";
import { ArrowUpCircle, ArrowDownCircle, Save, Trash2 } from "lucide-react";
import ConfirmationModal from "@/components/ui/ConfirmationModal";
import Toast from "@/components/ui/toast";
import { Header } from "@/components/Layout/Header";

// ---------- Interfaces ----------
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
}

// ---------- Constants ----------
const MAJOR_KEYS = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
const MINOR_KEYS = MAJOR_KEYS.map((k) => k + "m");

function isMinorKey(k: string) {
  return k.endsWith("m");
}

/**
 * Splits the text into tokens (words or spaces) while preserving each token’s
 * start index in the original string.
 */
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

/**
 * ChordLine Component
 */
const ChordLine: React.FC<{
  line: LyricLine;
  editable: boolean;
  onChange?: (text: string, chords: Chord[]) => void;
}> = ({ line, editable, onChange }) => {
  const [text, setText] = useState(line.text);
  const [chords, setChords] = useState<Chord[]>(line.chords);

  useEffect(() => {
    setText(line.text);
    setChords(line.chords);
  }, [line]);

  // ---------------------------
  // EDIT MODE
  // ---------------------------
  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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

  const addChord = () => {
    const newChords = [...chords, { chord: "", position: 0 }];
    setChords(newChords);
    onChange?.(text, newChords);
  };

  if (editable) {
    // Show the single-line input with chord positions
    return (
      <div className="space-y-2 relative">
        <div className="max-w-full overflow-x-auto">
          <div className="relative w-full font-mono whitespace-pre text-sm md:text-base lg:text-lg">
            <div className="relative" style={{ minHeight: "20px" }}>
              {chords.map((c, idx) => (
                <span
                  key={idx}
                  className="absolute text-blue-600 text-sm md:text-base lg:text-lg"
                  style={{ left: `${c.position * 8}px`, top: "0px" }}
                >
                  {c.chord}
                </span>
              ))}
            </div>
            <input
              type="text"
              className="text-gray-800 font-mono border border-gray-300 p-1 rounded w-full text-sm md:text-base lg:text-lg"
              value={text}
              onChange={handleTextChange}
              maxLength={300}
            />
          </div>
        </div>
        <div className="flex flex-col mt-2 space-y-2">
          {chords.map((c, idx) => (
            <div key={idx} className="flex gap-2">
              <input
                type="text"
                className="border p-1 rounded w-24 text-sm md:text-base lg:text-lg"
                value={c.chord}
                onChange={(e) => handleChordChange(idx, "chord", e.target.value)}
              />
              <input
                type="number"
                className="border p-1 rounded w-20 text-sm md:text-base lg:text-lg"
                value={c.position}
                onChange={(e) => handleChordChange(idx, "position", e.target.value)}
              />
            </div>
          ))}
          <button
            type="button"
            onClick={addChord}
            className="bg-purple-500 text-white px-3 py-1 rounded text-sm md:text-base lg:text-lg"
          >
            + Add Chord
          </button>
        </div>
      </div>
    );
  }

  // ---------------------------
  // READ-ONLY MODE
  // ---------------------------
  // CHANGES:
  //  - Increased line-height to leading-[3.2]
  //  - Increased chord offset top to -1.2em
  const tokens = splitLineByWordsWithIndex(text);

  return (
    <div
      className="
        font-mono
        text-sm md:text-base lg:text-lg
        leading-[2.5]      /* Larger line-height to prevent overlap on big screens */
        flex flex-wrap
      "
      style={{ marginBottom: "0.5rem" }} // Extra margin if needed
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
                  className="absolute text-blue-600 text-sm md:text-base lg:text-lg"
                  style={{
                    left: `${relIndex}ch`,
                    top: "-0.7em", // Move chord higher for larger text
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
  );
};

// --------------------------------------------------
// SONG DETAIL PAGE
// --------------------------------------------------
export default function SongDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  const [song, setSong] = useState<Song | null>(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [editedLyrics, setEditedLyrics] = useState<LyricLine[]>([]);
  const [transposedLyrics, setTransposedLyrics] = useState<LyricLine[] | null>(null);
  const [transposedKey, setTransposedKey] = useState<string | null>(null);
  const [targetKey, setTargetKey] = useState("");
  const [isTransposing, setIsTransposing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editedTitle, setEditedTitle] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [toast, setToast] = useState<{ message: string; type?: "success" | "error" | "info" } | null>(null);

  useEffect(() => {
    AxiosInstance.get(`songs/${id}/`)
      .then((res) => {
        setSong(res.data);
        setEditedTitle(res.data.title);
        setEditedLyrics(res.data.lyrics);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching song details:", err);
        setLoading(false);
        if (err.response && err.response.status === 401) {
          navigate("/login");
        }
      });
  }, [id, navigate]);

  const handleLyricChange = (index: number, text: string, chords: Chord[]) => {
    const updated = [...editedLyrics];
    updated[index] = { text, chords };
    setEditedLyrics(updated);
  };

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
      });
      setToast({ message: "Song saved successfully", type: "success" });
      setTimeout(() => {
        navigate(`/songs/${response.data.id}`);
      }, 1500);
    } catch (err) {
      console.error("Error saving new version:", err);
      setToast({ message: "Error saving song", type: "error" });
    } finally {
      setIsSaving(false);
    }
  };

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
      });
      setToast({ message: "Song updated successfully", type: "success" });
      setTimeout(() => {
        navigate(`/songs/${response.data.id}`);
      }, 1500);
    } catch (err) {
      console.error("Error updating song:", err);
      setToast({ message: "Error updating song", type: "error" });
    } finally {
      setIsSaving(false);
    }
  };

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

  const handleKeyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const chosenKey = e.target.value;
    setTargetKey(chosenKey);
    if (chosenKey) {
      transposeSong({ target_key: chosenKey });
    }
  };

  const addLine = () => {
    setEditedLyrics([...editedLyrics, { text: "", chords: [] }]);
  };

  if (loading) return <div>Loading song details...</div>;
  if (!song) return <div>Song not found</div>;

  const displayLyrics = transposedLyrics || editedLyrics;
  const keysToDisplay = isMinorKey(song.key) ? MINOR_KEYS : MAJOR_KEYS;

  return (
    <div className="relative flex min-h-screen bg-[#EFF1F7]">
      <Sidebar />
      <div className="flex-1 px-2 py-4 md:px-8 md:py-10 w-full">
        <Header />
        <Card className="bg-white w-full max-w-4xl mx-auto my-4 md:my-8 p-4 md:p-10">
          {/* Title and artist */}
          <div className="flex flex-col md:flex-row justify-between items-start mb-8 space-y-4 md:space-y-0">
            <div className="text-left">
              {editMode ? (
                <input
                  type="text"
                  className="border border-gray-300 p-2 rounded w-full text-xl md:text-2xl lg:text-3xl font-bold mb-2"
                  value={editedTitle}
                  onChange={(e) => setEditedTitle(e.target.value)}
                />
              ) : (
                <h1 className="text-xl md:text-2xl lg:text-3xl font-bold mb-2">{song.title}</h1>
              )}
              <p className="text-gray-600 text-base md:text-lg lg:text-xl mb-4">By {song.artist}</p>
              <div className="flex flex-wrap gap-4 text-base md:text-lg lg:text-xl">
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

            {/* Buttons */}
            <div className="flex flex-wrap gap-4 text-sm lg:text-base">
              {/* Transposition controls */}
              <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-1 flex items-center gap-2">
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
                  className="px-2 py-1 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm md:text-base lg:text-lg"
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

              {/* Edit / Cancel Edit */}
              {!editMode ? (
                <button
                  onClick={() => setEditMode(true)}
                  className="bg-green-500 hover:bg-green-700 text-white px-3 py-1 rounded text-sm md:text-base lg:text-lg"
                >
                  Edit
                </button>
              ) : (
                <button
                  onClick={() => {
                    setTransposedLyrics(null);
                    setEditMode(false);
                  }}
                  className="bg-gray-500 hover:bg-gray-700 text-white px-3 py-1 rounded text-sm md:text-base lg:text-lg"
                >
                  Cancel Edit
                </button>
              )}

              {/* Save Version Button */}
              <button
                onClick={saveNewVersion}
                disabled={isSaving}
                className="flex items-center gap-1 bg-[#9b87f5] hover:bg-[#7E69AB] text-white px-3 py-1 rounded-lg transition-colors duration-200 disabled:opacity-50 text-sm md:text-base lg:text-lg"
              >
                <Save className="h-4 w-4" />
                {isSaving ? "Saving..." : "Save Version"}
              </button>

              {/* Update current song button */}
              {editMode && (
                <button
                  onClick={updateSong}
                  disabled={isSaving}
                  className="flex items-center gap-1 bg-blue-600 hover:bg-blue-800 text-white px-3 py-1 rounded-lg transition-colors duration-200 disabled:opacity-50 text-sm md:text-base lg:text-lg"
                >
                  {isSaving ? "Saving..." : "Save Changes"}
                </button>
              )}

              {/* Delete */}
              <button
                onClick={handleDeleteSong}
                className="flex items-center gap-1 bg-red-500 hover:bg-red-700 text-white px-3 py-1 rounded-lg transition-colors duration-200 text-sm md:text-base lg:text-lg"
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </button>
            </div>
          </div>

          {/* Lyrics / Chords */}
          <div className="space-y-6 mt-8">
            {displayLyrics.map((line, i) => (
              <ChordLine
                key={i}
                line={line}
                editable={editMode}
                onChange={(text, chords) => handleLyricChange(i, text, chords)}
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
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add New Line
              </button>
            )}
          </div>
        </Card>
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
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
