import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import AxiosInstance from "@/components/axios";
import { Sidebar } from "@/components/Layout/Sidebar";
import { useIsMobile } from "@/hooks/use-mobile";
import { TabNotation } from "@/components/GuitarTab/TabNotation";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Edit, Save, Trash2, RotateCcw } from "lucide-react";
import { Header } from "@/components/Layout/Header";

interface NoteConnection {
  type: "slide" | "hammerOn" | "pullOff";
  connectedString: number;
  connectedFret: number;
  connectedPosition: number;
}

interface Note {
  fret: number;
  position: number;
  connection?: NoteConnection;
}

interface StringData {
  string: number;
  notes: Note[];
}

interface TabLine {
  strings: StringData[];
}

interface GuitarTabData {
  lines: TabLine[];
}

interface GuitarTab {
  id: number;
  title: string;
  artist: string;
  imageUrl?: string | null;
  tab_data: GuitarTabData;
  created_at?: string;
  updated_at?: string;
}

export default function GuitarTabDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  const [tab, setTab] = useState<GuitarTab | null>(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);

  // Editable fields
  const [editedTitle, setEditedTitle] = useState("");
  const [editedArtist, setEditedArtist] = useState("");
  const [lines, setLines] = useState<TabLine[]>([]);
  const [linesHistory, setLinesHistory] = useState<TabLine[][]>([]);

  function snapshotLines() {
    setLinesHistory((prev) => [
      ...prev,
      JSON.parse(JSON.stringify(lines)),
    ]);
  }

  function handleUndo() {
    if (linesHistory.length === 0) return;
    const previous = linesHistory[linesHistory.length - 1];
    setLines(previous);
    setLinesHistory((prev) => prev.slice(0, prev.length - 1));
  }

  const [newNoteInputs, setNewNoteInputs] = useState<{ fret: string; position: string }[][]>([]);
  const [selectedNote, setSelectedNote] = useState<{ lineIndex: number; stringIndex: number; noteIndex: number } | null>(null);
  const [techniqueType, setTechniqueType] = useState<"slide" | "hammerOn" | "pullOff" | null>(null);

  useEffect(() => {
    const fetchTabDetail = async () => {
      try {
        setLoading(true);
        const response = await AxiosInstance.get(`guitartabs/${id}/`);
        const data: GuitarTab = response.data;
        setTab(data);
        setEditedTitle(data.title);
        setEditedArtist(data.artist);
        const loadedLines = data.tab_data?.lines?.length
          ? data.tab_data.lines
          : [
            {
              strings: [
                { string: 1, notes: [] },
                { string: 2, notes: [] },
                { string: 3, notes: [] },
                { string: 4, notes: [] },
                { string: 5, notes: [] },
                { string: 6, notes: [] },
              ],
            },
          ];
        setLines(loadedLines);
        const inputs = loadedLines.map((line) =>
          line.strings.map(() => ({ fret: "", position: "" }))
        );
        setNewNoteInputs(inputs);
        setLinesHistory([JSON.parse(JSON.stringify(loadedLines))]);
      } catch (error: any) {
        console.error("Error fetching tab detail:", error);
        if (error.response && error.response.status === 401) {
          navigate("/login");
        }
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchTabDetail();
    }
  }, [id, navigate]);

  const handleAddLine = () => {
    snapshotLines();
    const newLine: TabLine = {
      strings: [
        { string: 1, notes: [] },
        { string: 2, notes: [] },
        { string: 3, notes: [] },
        { string: 4, notes: [] },
        { string: 5, notes: [] },
        { string: 6, notes: [] },
      ],
    };
    const updated = [...lines, newLine];
    setLines(updated);
    setNewNoteInputs((prev) => [
      ...prev,
      newLine.strings.map(() => ({ fret: "", position: "" })),
    ]);
  };

  const handleChangeInput = (
    lineIndex: number,
    stringIndex: number,
    field: "fret" | "position",
    value: string
  ) => {
    const updated = [...newNoteInputs];
    updated[lineIndex][stringIndex][field] = value;
    setNewNoteInputs(updated);
  };

  const handleLineKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    lineIndex: number
  ) => {
    if (e.key === "Enter") {
      const hasAnyValidNote = newNoteInputs[lineIndex].some((entry) => {
        const fretValue = parseInt(entry.fret, 10);
        const posValue = parseInt(entry.position, 10);
        return !isNaN(fretValue) && !isNaN(posValue);
      });
      if (!hasAnyValidNote) return;
      snapshotLines();
      const updatedLines = [...lines];
      const updatedInputs = [...newNoteInputs];
      updatedInputs[lineIndex].forEach((entry, stringIdx) => {
        const fretValue = parseInt(entry.fret, 10);
        const posValue = parseInt(entry.position, 10);
        if (!isNaN(fretValue) && !isNaN(posValue)) {
          const alreadyExists = updatedLines[lineIndex].strings[stringIdx].notes.some(
            (note) => note.position === posValue
          );
          if (!alreadyExists) {
            const newNote: Note = { fret: fretValue, position: posValue };
            updatedLines[lineIndex].strings[stringIdx].notes.push(newNote);
          }
        }
        updatedInputs[lineIndex][stringIdx] = { fret: "", position: "" };
      });
      setLines(updatedLines);
      setNewNoteInputs(updatedInputs);
    }
  };

  const handleNoteClick = (
    lineIndex: number,
    stringIndex: number,
    noteIndex: number
  ) => {
    if (!selectedNote) {
      setSelectedNote({ lineIndex, stringIndex, noteIndex });
      return;
    }
    if (techniqueType) {
      if (
        lineIndex === selectedNote.lineIndex &&
        stringIndex === selectedNote.stringIndex &&
        noteIndex === selectedNote.noteIndex
      ) {
        alert("Cannot connect a note to itself.");
        return;
      }
      snapshotLines();
      const updatedLines = [...lines];
      const fromLine = updatedLines[selectedNote.lineIndex];
      const fromStringData = fromLine.strings[selectedNote.stringIndex];
      const fromNote = fromStringData.notes[selectedNote.noteIndex];
      const toLine = updatedLines[lineIndex];
      const toStringData = toLine.strings[stringIndex];
      const toNote = toStringData.notes[noteIndex];
      fromNote.connection = {
        type: techniqueType,
        connectedString: toStringData.string,
        connectedFret: toNote.fret,
        connectedPosition: toNote.position,
      };
      setLines(updatedLines);
      setSelectedNote(null);
      setTechniqueType(null);
    }
  };

  const handleSaveChanges = async () => {
    if (!tab) return;
    const newTabData: GuitarTabData = { lines };
    try {
      const response = await AxiosInstance.put(`guitartabs/${id}/`, {
        title: editedTitle,
        artist: editedArtist,
        tab_data: newTabData,
      });
      setTab(response.data);
      setEditMode(false);
    } catch (error: any) {
      console.error("Error updating tab:", error);
      if (error.response && error.response.status === 401) {
        navigate("/login");
      }
    }
  };

  const handleDeleteTab = async () => {
    if (!tab) return;
    try {
      await AxiosInstance.delete(`guitartabs/${id}/`);
      navigate("/guitar-tabs");
    } catch (error: any) {
      console.error("Error deleting tab:", error);
      if (error.response && error.response.status === 401) {
        navigate("/login");
      }
    }
  };

  if (loading) {
    return (
      <div className="relative flex min-h-screen bg-[#EFF1F7]">
        <Sidebar />
        <div className="flex-1 transition-all duration-300">
          <div className="p-6">Loading tab details...</div>
        </div>
      </div>
    );
  }

  if (!tab) {
    return (
      <div className="relative flex min-h-screen bg-[#EFF1F7]">
        <Sidebar />
        <div className="flex-1 transition-all duration-300">
          <div className="p-6">
            <Card className="p-6 bg-white">
              <h1 className="text-2xl font-bold mb-4">Tab Not Found</h1>
              <button
                onClick={() => navigate("/guitar-tabs")}
                className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                <ArrowLeft className="h-5 w-5" />
                Back to Guitar Tabs
              </button>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen bg-[#EFF1F7]">
      <Sidebar />
      {/* Removed conditional margin for consistent responsiveness */}
      <div className="flex-1 transition-all duration-300">
        <Header />
        <div className="p-6">
          <button
            onClick={() => navigate("/guitar-tabs")}
            className="flex items-center gap-2 text-blue-600 mb-4 hover:text-blue-800"
          >
            <ArrowLeft className="h-5 w-5" />
            Back to Guitar Tabs
          </button>
          <Card className="p-6 bg-white">
            <div className="flex flex-col md:flex-row justify-between md:items-center mb-6 gap-4">
              <div>
                {editMode ? (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Title
                      </label>
                      <input
                        type="text"
                        className="border border-gray-300 p-2 rounded w-full max-w-md"
                        value={editedTitle}
                        onChange={(e) => setEditedTitle(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Artist
                      </label>
                      <input
                        type="text"
                        className="border border-gray-300 p-2 rounded w-full max-w-md"
                        value={editedArtist}
                        onChange={(e) => setEditedArtist(e.target.value)}
                      />
                    </div>
                  </div>
                ) : (
                  <>
                    <h1 className="text-3xl font-bold">{tab.title}</h1>
                    <p className="text-gray-600 text-xl">By {tab.artist}</p>
                  </>
                )}
              </div>
              <div className="flex flex-wrap gap-3">
                {!editMode ? (
                  <>
                    <button
                      onClick={() => setEditMode(true)}
                      className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                    >
                      <Edit className="h-5 w-5" />
                      Edit
                    </button>
                    <button
                      onClick={handleDeleteTab}
                      className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
                    >
                      <Trash2 className="h-5 w-5" />
                      Delete
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={handleSaveChanges}
                      className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                    >
                      <Save className="h-5 w-5" />
                      Save
                    </button>
                    <button
                      onClick={handleUndo}
                      className="flex items-center gap-2 bg-gray-400 text-white px-4 py-2 rounded hover:bg-gray-500"
                      title="Undo (Ctrl+Z)"
                    >
                      <RotateCcw className="h-5 w-5" />
                      Undo
                    </button>
                  </>
                )}
              </div>
            </div>
            {editMode && (
              <div className="flex items-center gap-2 mb-4">
                <p className="font-medium text-sm">Select Technique:</p>
                <button
                  onClick={() => setTechniqueType("slide")}
                  className={`px-2 py-1 rounded text-sm ${techniqueType === "slide" ? "bg-blue-500 text-white" : "bg-gray-200"
                    }`}
                >
                  Slide
                </button>
                <button
                  onClick={() => setTechniqueType("hammerOn")}
                  className={`px-2 py-1 rounded text-sm ${techniqueType === "hammerOn" ? "bg-blue-500 text-white" : "bg-gray-200"
                    }`}
                >
                  H.O.
                </button>
                <button
                  onClick={() => setTechniqueType("pullOff")}
                  className={`px-2 py-1 rounded text-sm ${techniqueType === "pullOff" ? "bg-blue-500 text-white" : "bg-gray-200"
                    }`}
                >
                  P.O.
                </button>
                {techniqueType && (
                  <span className="text-xs text-gray-600">
                    Click first note, then second note to connect.
                  </span>
                )}
              </div>
            )}
            {editMode ? (
              <div className="space-y-8">
                {lines.map((line, lineIndex) => (
                  <div
                    key={lineIndex}
                    className="border border-gray-200 rounded bg-gray-50 p-4"
                  >
                    <h2 className="font-semibold mb-4">Line {lineIndex + 1}</h2>
                    <div className="flex flex-col md:flex-row gap-4">
                      <div className="md:w-1/3 space-y-6">
                        {line.strings.map((stringData, stringIdx) => (
                          <div
                            key={stringIdx}
                            className="p-2 bg-white rounded border"
                          >
                            <h3 className="font-medium mb-2">
                              String {stringData.string}
                            </h3>
                            <div className="flex items-center gap-4 mb-2">
                              <div className="flex flex-col items-center">
                                <label className="text-xs">Fret</label>
                                <input
                                  type="number"
                                  className="border border-gray-300 rounded w-12 text-center"
                                  value={newNoteInputs[lineIndex][stringIdx].fret}
                                  onChange={(e) =>
                                    handleChangeInput(lineIndex, stringIdx, "fret", e.target.value)
                                  }
                                  onKeyDown={(e) =>
                                    handleLineKeyDown(e, lineIndex)
                                  }
                                />
                              </div>
                              <div className="flex flex-col items-center">
                                <label className="text-xs">Pos</label>
                                <input
                                  type="number"
                                  className="border border-gray-300 rounded w-12 text-center"
                                  value={newNoteInputs[lineIndex][stringIdx].position}
                                  onChange={(e) =>
                                    handleChangeInput(lineIndex, stringIdx, "position", e.target.value)
                                  }
                                  onKeyDown={(e) =>
                                    handleLineKeyDown(e, lineIndex)
                                  }
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="md:w-2/3 border border-gray-200 p-2 rounded bg-white flex items-center justify-center">
                        <TabNotation
                          tabData={line}
                          editMode={true}
                          onNoteClick={(strIdx, noteIdx) =>
                            handleNoteClick(lineIndex, strIdx, noteIdx)
                          }
                        />
                      </div>
                    </div>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={handleAddLine}
                  className="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600"
                >
                  + Add Another Line
                </button>
              </div>
            ) : (
              <div className="space-y-8">
                {lines.map((line, lineIndex) => (
                  <div
                    key={lineIndex}
                    className="border border-gray-200 p-4 rounded-lg bg-gray-50"
                  >
                    <h2 className="font-semibold mb-4">Line {lineIndex + 1}</h2>
                    <TabNotation tabData={line} editMode={false} />
                  </div>
                ))}
              </div>
            )}
            {tab.created_at && (
              <p className="text-sm text-gray-500 mt-6">
                Created: {new Date(tab.created_at).toLocaleDateString()}
                {tab.updated_at &&
                  tab.updated_at !== tab.created_at &&
                  ` · Updated: ${new Date(tab.updated_at).toLocaleDateString()}`}
              </p>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
