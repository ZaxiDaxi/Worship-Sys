import React, { useState } from "react";
import AxiosInstance from "@/components/axios"; // Use the custom Axios instance
import { Sidebar } from "@/components/Layout/Sidebar";
import { useIsMobile } from "@/hooks/use-mobile";
import Toast from "@/components/ui/toast";
import { Header } from "@/components/Layout/Header"; // Added global header

interface Chord {
  chord: string;
  position: number;
}

interface LyricLine {
  text: string;
  chords: Chord[];
}

const ChordLineCreator: React.FC<{
  line: LyricLine;
  index: number;
  onChange: (i: number, lineData: LyricLine) => void;
  onRemove: (i: number) => void;
}> = ({ line, index, onChange, onRemove }) => {
  const [text, setText] = useState(line.text);
  const [chords, setChords] = useState<Chord[]>(line.chords);

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newText = e.target.value;
    const positionShift = newText.length - text.length;
    const updatedChords = chords.map((c) => ({
      ...c,
      position: Math.max(0, c.position + positionShift),
    }));
    setText(newText);
    setChords(updatedChords);
    onChange(index, { text: newText, chords: updatedChords });
  };

  const handleChordChange = (
    chordIndex: number,
    field: "chord" | "position",
    value: string | number
  ) => {
    const updated = [...chords];
    if (field === "chord") {
      updated[chordIndex].chord = value as string;
    } else {
      let pos = Math.max(0, Math.min(text.length, Number(value)));
      updated[chordIndex].position = pos;
    }
    setChords(updated);
    onChange(index, { text, chords: updated });
  };

  const addChord = () => {
    const newChords = [...chords, { chord: "", position: 0 }];
    setChords(newChords);
    onChange(index, { text, chords: newChords });
  };

  return (
    <div className="space-y-2 mb-4 relative">
      <div className="relative w-full font-mono text-sm">
        <div className="relative text-blue-600" style={{ minHeight: "20px" }}>
          {chords.map(({ chord, position }, idx) => (
            <span key={idx} className="absolute" style={{ left: `${position * 8}px`, top: "0px" }}>
              {chord}
            </span>
          ))}
        </div>
        <input
          type="text"
          className="w-full text-gray-800 font-mono border border-gray-300 p-1 rounded"
          value={text}
          onChange={handleTextChange}
        />
      </div>
      <div className="flex flex-col mt-2 space-y-2">
        {chords.map((chordObj, idx) => (
          <div key={idx} className="flex gap-2">
            <input
              type="text"
              className="border p-1 rounded w-24"
              value={chordObj.chord}
              onChange={(e) => handleChordChange(idx, "chord", e.target.value)}
            />
            <input
              type="number"
              className="border p-1 rounded w-20"
              value={chordObj.position}
              onChange={(e) => handleChordChange(idx, "position", e.target.value)}
            />
          </div>
        ))}
        <button type="button" onClick={addChord} className="bg-purple-500 text-white px-3 py-1 rounded">
          + Add Chord
        </button>
      </div>
      <button type="button" onClick={() => onRemove(index)} className="mt-2 text-sm text-red-500 underline">
        Remove this line
      </button>
    </div>
  );
};

export default function SongCreate() {
  const isMobile = useIsMobile();
  const [title, setTitle] = useState("");
  const [artist, setArtist] = useState("");
  const [keyVal, setKeyVal] = useState("");
  const [tempo, setTempo] = useState("");
  const [timeSignature, setTimeSignature] = useState("");
  const [lines, setLines] = useState<LyricLine[]>([{ text: "", chords: [] }]);
  const [toast, setToast] = useState<{ message: string; type?: "success" | "error" | "info" } | null>(null);

  const addLine = () => {
    setLines([...lines, { text: "", chords: [] }]);
  };

  const handleLineChange = (i: number, updatedLine: LyricLine) => {
    const newLines = [...lines];
    newLines[i] = updatedLine;
    setLines(newLines);
  };

  const handleRemoveLine = (i: number) => {
    const newLines = [...lines];
    newLines.splice(i, 1);
    setLines(newLines);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
      setTitle("");
      setArtist("");
      setKeyVal("");
      setTempo("");
      setTimeSignature("");
      setLines([{ text: "", chords: [] }]);
    } catch (err) {
      console.error(err);
      setToast({ message: "Error creating song", type: "error" });
    }
  };

  return (
    <div className="relative flex min-h-screen bg-[#EFF1F7]">
      <Sidebar />
      <div className={`flex-1 transition-all duration-300 ${isMobile ? "ml-0" : "md:ml-64"}`}>
        <Header /> {/* Global Header */}
        <div className="p-6">
          <div className="max-w-3xl mx-auto bg-white p-6 rounded-md shadow">
            <h1 className="text-2xl font-bold mb-4">Create New Song</h1>
            <form onSubmit={handleSubmit} className="space-y-4">
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
                <label className="block mb-1 font-semibold">Time Signature</label>
                <input
                  type="text"
                  className="border border-gray-300 p-2 rounded w-full"
                  value={timeSignature}
                  onChange={(e) => setTimeSignature(e.target.value)}
                />
              </div>
              <div>
                <h2 className="text-lg font-semibold mb-2 mt-6">Lyrics & Chords</h2>
                {lines.map((line, i) => (
                  <ChordLineCreator
                    key={i}
                    line={line}
                    index={i}
                    onChange={handleLineChange}
                    onRemove={handleRemoveLine}
                  />
                ))}
                <button type="button" onClick={addLine} className="bg-blue-500 text-white px-4 py-2 rounded">
                  + Add Line
                </button>
              </div>
              <button type="submit" className="bg-green-600 text-white px-6 py-2 rounded font-semibold">
                Create Song
              </button>
            </form>
          </div>
        </div>
      </div>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
