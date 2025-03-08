import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import AxiosInstance from "@/components/axios";
import { Card } from "@/components/ui/card";
import { Sidebar } from "@/components/Layout/Sidebar";
import { useIsMobile } from "@/hooks/use-mobile";
import { ArrowUpCircle, ArrowDownCircle, Save, Trash2 } from "lucide-react";
import ConfirmationModal from "@/components/ui/ConfirmationModal";
import Toast from "@/components/ui/toast";
import { Header } from "@/components/Layout/Header"; // Global Header
import { TabNotation } from "@/components/GuitarTab/TabNotation"; // For showing attached tab

// -------------------------
// Interfaces
// -------------------------
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

// A small helper to split the lyric line text so we can position chords correctly
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

// -------------------------
// ChordLine Component
// -------------------------
const ChordLine: React.FC<{
  line: LyricLine;
  editable: boolean;
  onChange?: (text: string, chords: Chord[]) => void;
}> = ({ line, editable, onChange }) => {
  const [text, setText] = useState(line.text);
  const [chords, setChords] = useState<Chord[]>(line.chords);
  const isMobile = useIsMobile();

  useEffect(() => {
    setText(line.text);
    setChords(line.chords);
  }, [line]);

  // Handle typed changes to the lyric text
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

  // Handle chord or chord-position edits
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

  // Add a new (empty) chord
  const addChord = () => {
    const newChords = [...chords, { chord: "", position: 0 }];
    setChords(newChords);
    onChange?.(text, newChords);
  };

  // Read-only mode (the chords above words)
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
              {tokenChords.map((c, chordIdx) => {
                const relIndex = c.position - tokenObj.start;
                return (
                  <span
                    key={chordIdx}
                    className="absolute text-blue-600 text-sm md:text-base lg:text-md"
                    style={{
                      left: `${relIndex}ch`,
                      top: isMobile ? "-0.9em" : "-1.1em",
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
  }

  // Editable lyric line
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

      {/* Chord editor (the list of chord inputs) */}
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
              onChange={(e) =>
                handleChordChange(idx, "position", e.target.value)
              }
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
};

// -------------------------
// MAIN SongDetail Component
// -------------------------
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

  // ADDED: States to handle attaching a guitar tab
  const [attachedTab, setAttachedTab] = useState<any>(null);
  const [showTabSelectionModal, setShowTabSelectionModal] = useState(false);
  const [availableTabs, setAvailableTabs] = useState<any[]>([]);

  useEffect(() => {
    setLoading(true);
    AxiosInstance.get(`songs/${id}/`)
      .then((res) => {
        const data: Song = res.data;
        setSong(data);
        setEditedTitle(data.title);
        setEditedLyrics(data.lyrics);

        // If there's an attached guitar_tab_id, fetch that tab
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

  // If user wants to attach a tab, fetch a list of available tabs
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

  const handleLyricChange = (index: number, text: string, chords: Chord[]) => {
    const updated = [...editedLyrics];
    updated[index] = { text, chords };
    setEditedLyrics(updated);
  };

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
  const displayLyrics = transposedLyrics || editedLyrics;

  return (
    <div className="relative flex min-h-screen bg-white md:bg-[#EFF1F7]">
      <Sidebar />
      <div className=" flex-1 transition-all duration-300">
        <div className="hidden md:block">
          <Header />
        </div>

        {/*
          p-0 on mobile, p-6 on md+ 
        */}
        <div className="p-0 md:p-6 bg-white">
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
                <h1 className="text-xl md:text-2xl lg:text-3xl font-bold mb-2">
                  {song.title}
                </h1>
              )}
              <p className="text-gray-600 text-base md:text-lg lg:text-xl mb-4">
                By {song.artist}
              </p>

              {/* Key / Tempo / Time */}
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

            <div className="flex flex-wrap gap-4 text-sm lg:text-base">
              {/* Transpose Controls remain visible at all times */}
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

              {/* Toggle Edit / Cancel Edit */}
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

              {/* Buttons only shown in edit mode */}
              {editMode && (
                <>
                  <button
                    onClick={updateSong}
                    disabled={isSaving}
                    className="flex items-center gap-1 bg-blue-600 hover:bg-blue-800 text-white px-3 py-1 rounded-lg transition-colors duration-200 disabled:opacity-50 text-sm md:text-base lg:text-lg"
                  >
                    {isSaving ? "Saving..." : "Save Changes"}
                  </button>
                  <button
                    onClick={saveNewVersion}
                    disabled={isSaving}
                    className="flex items-center gap-1 bg-purple-600 hover:bg-purple-800 text-white px-3 py-1 rounded-lg transition-colors duration-200 disabled:opacity-50 text-sm md:text-base lg:text-lg"
                  >
                    <Save className="h-4 w-4" />
                    Save Version
                  </button>
                  <button
                    onClick={handleDeleteSong}
                    className="flex items-center gap-1 bg-red-500 hover:bg-red-700 text-white px-3 py-1 rounded-lg transition-colors duration-200 text-sm md:text-base lg:text-lg"
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </button>
                  <button
                    onClick={() => setShowTabSelectionModal(true)}
                    className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded-lg transition-colors duration-200 text-sm md:text-base lg:text-lg"
                  >
                    Attach Guitar Tab
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Lyrics */}
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

            {/* Attached Tab (if any) */}
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

      {/* Confirm Delete Dialog */}
      {showDeleteConfirm && (
        <ConfirmationModal
          isOpen={showDeleteConfirm}
          title="Confirm Deletion"
          message="Are you sure you want to delete this song?"
          onConfirm={confirmDelete}
          onCancel={() => setShowDeleteConfirm(false)}
        />
      )}

      {/* Toast messages */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Attach Guitar Tab Modal */}
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
                      // Once user chooses a tab, update the song so it references the new attached tab ID
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
    </div>
  );
}
