import React, { useState } from "react";
import AxiosInstance from "@/components/axios";
import { Sidebar } from "@/components/Layout/Sidebar";
import Toast from "@/components/ui/toast";
import { Header } from "@/components/Layout/Header";
import Button from "@mui/material/Button";          // still needed for “Delete Line”
import ChordLine, { LyricLine } from "@/components/reuse/ChordLine";
import EditToolbar from "@/components/reuse/EditToolbar";
import GreenButton from "@/components/reuse/GreenButton";  // ← reusable button

const SongCreate: React.FC = () => {
  const [title, setTitle] = useState("");
  const [artist, setArtist] = useState("");
  const [keyVal, setKeyVal] = useState("");
  const [tempo, setTempo] = useState("");
  const [timeSignature, setTimeSignature] = useState("");
  const [lines, setLines] = useState<LyricLine[]>([
    { text: "", chords: [{ chord: "", position: 0 }] },
  ]);
  const [toast, setToast] = useState<
    { message: string; type?: "success" | "error" | "info" } | null
  >(null);

  // undo / redo history
  const [past, setPast] = useState<LyricLine[][]>([]);
  const [future, setFuture] = useState<LyricLine[][]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  /* ────────────── Utility functions ────────────── */

  const updateLines = (newLines: LyricLine[]) => {
    if (JSON.stringify(newLines) === JSON.stringify(lines)) return;
    setPast((prev) => [...prev, lines]);
    setLines(newLines);
    setFuture([]);
  };

  const addLine = () =>
    updateLines([
      ...lines,
      { text: "", chords: [{ chord: "", position: 0 }] },
    ]);

  const handleLineChange = (i: number, updatedLine: LyricLine) => {
    const newLines = [...lines];
    newLines[i] = updatedLine;
    updateLines(newLines);
  };

  const handleRemoveLine = (i: number) => {
    const newLines = [...lines];
    newLines.splice(i, 1);
    updateLines(newLines);
  };

  const undo = () => {
    if (past.length === 0) return;
    const previous = past[past.length - 1];
    setPast((prev) => prev.slice(0, prev.length - 1));
    setFuture((prev) => [lines, ...prev]);
    setLines(previous);
  };

  const redo = () => {
    if (future.length === 0) return;
    const next = future[0];
    setFuture((prev) => prev.slice(1));
    setPast((prev) => [...prev, lines]);
    setLines(next);
  };

  /* ────────────── Submit ────────────── */

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();                   // keep preventDefault: still a <form>
    const payload = {
      title,
      artist,
      key: keyVal,
      tempo,
      time_signature: timeSignature,
      lyrics: lines,
    };

    try {
      await AxiosInstance.post("songs/create/", payload);
      setToast({ message: "Song created successfully", type: "success" });
      // reset form
      setTitle("");
      setArtist("");
      setKeyVal("");
      setTempo("");
      setTimeSignature("");
      setLines([{ text: "", chords: [{ chord: "", position: 0 }] }]);
      setPast([]);
      setFuture([]);
    } catch (err) {
      console.error(err);
      setToast({ message: "Error creating song", type: "error" });
    }
  };

  /* ────────────── UI ────────────── */

  return (
    <div className="relative flex min-h-screen bg-white">
      <Sidebar onToggle={(open) => setSidebarOpen(open)} />

      <div className="flex-1 transition-all duration-300">
        <Header />

        <div className="p-6">
          <div className="max-w-3xl mx-auto bg-white p-6 rounded-md shadow">
            <h1 className="text-2xl font-bold mb-4">Create New Song</h1>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* ───────── Song Info ───────── */}
              <div>
                <label className="block mb-1 font-semibold">Title</label>
                <input
                  type="text"
                  className="border border-gray-300 p-2 rounded w-full"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block mb-1 font-semibold">Artist</label>
                <input
                  type="text"
                  className="border border-gray-300 p-2 rounded w-full"
                  value={artist}
                  onChange={(e) => setArtist(e.target.value)}
                />
              </div>

              <div>
                <label className="block mb-1 font-semibold">Key</label>
                <input
                  type="text"
                  className="border border-gray-300 p-2 rounded w-full"
                  value={keyVal}
                  onChange={(e) => setKeyVal(e.target.value)}
                />
              </div>

              <div>
                <label className="block mb-1 font-semibold">Tempo</label>
                <input
                  type="text"
                  className="border border-gray-300 p-2 rounded w-full"
                  value={tempo}
                  onChange={(e) => setTempo(e.target.value)}
                />
              </div>

              <div>
                <label className="block mb-1 font-semibold">
                  Time Signature
                </label>
                <input
                  type="text"
                  className="border border-gray-300 p-2 rounded w-full"
                  value={timeSignature}
                  onChange={(e) => setTimeSignature(e.target.value)}
                />
              </div>

              {/* ───────── Lyrics & Chords ───────── */}
              <div>
                <h2 className="text-lg font-semibold mb-2 mt-6">
                  Lyrics &amp; Chords
                </h2>

                {lines.map((line, i) => (
                  <div key={i}>
                    <ChordLine
                      line={line}
                      editable
                      onChange={(newText, newChords) =>
                        handleLineChange(i, {
                          text: newText,
                          chords: newChords,
                        })
                      }
                    />

                    {lines.length > 1 && (
                      <Button
                        variant="outlined"
                        onClick={() => handleRemoveLine(i)}
                        sx={{
                          color: "#B71C1C",
                          borderColor: "#B71C1C",
                          "&:hover": { backgroundColor: "#FFEBEE" },
                          marginBottom: "1rem",
                        }}
                      >
                        Delete Line
                      </Button>
                    )}
                  </div>
                ))}
              </div>

              {/* ───────── Submit ───────── */}
              <GreenButton type="submit" label="Create Song" />
            </form>
          </div>
        </div>
      </div>

      <EditToolbar
        onUndo={undo}
        onRedo={redo}
        onAdd={addLine}
        isSidebarOpen={sidebarOpen}
      />

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

export default SongCreate;
