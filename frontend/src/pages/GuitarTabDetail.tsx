import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import AxiosInstance from "@/components/axios";
import { Sidebar } from "@/components/Layout/Sidebar";
import { useIsMobile } from "@/hooks/use-mobile";
import { TabNotation } from "@/components/GuitarTab/TabNotation";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Edit, Save, Trash2, RotateCcw } from "lucide-react";
import { Header } from "@/components/Layout/Header"; // Added global Header

// Same interfaces as your TabNotation:
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
  string: number; // 1..6
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

  // Editable text fields
  const [editedTitle, setEditedTitle] = useState("");
  const [editedArtist, setEditedArtist] = useState("");

  // The core tab data: multiple lines
  const [lines, setLines] = useState<TabLine[]>([]);

  /**
   * ============ NEW: HISTORY STACK ============
   * We'll store snapshots of `lines` in here. The top (end) is the most recent.
   */
  const [linesHistory, setLinesHistory] = useState<TabLine[][]>([]);

  /**
   * Helper to push a snapshot of the *current* lines to the history stack.
   * We'll call this right BEFORE we mutate `lines`.
   */
  function snapshotLines() {
    setLinesHistory((prev) => [
      ...prev,
      // Deep-clone the current lines so we don't store references
      JSON.parse(JSON.stringify(lines)),
    ]);
  }

  /**
   * Undo = revert to the last snapshot in linesHistory.
   */
  function handleUndo() {
    if (linesHistory.length === 0) {
      return; // nothing to undo
    }
    // Pop the last snapshot
    const previous = linesHistory[linesHistory.length - 1];
    setLines(previous); // revert to it
    setLinesHistory((prev) => prev.slice(0, prev.length - 1));
  }

  // For new note inputs:
  const [newNoteInputs, setNewNoteInputs] = useState<
    { fret: string; position: string }[][]
  >([]);

  // ============ Technique selection & note selection for connections ===========
  const [selectedNote, setSelectedNote] = useState<{
    lineIndex: number;
    stringIndex: number;
    noteIndex: number;
  } | null>(null);

  const [techniqueType, setTechniqueType] = useState<
    "slide" | "hammerOn" | "pullOff" | null
  >(null);

  // ----------------------------
  // FETCH TAB DETAILS
  // ----------------------------
  useEffect(() => {
    const fetchTabDetail = async () => {
      try {
        setLoading(true);
        const response = await AxiosInstance.get(`guitartabs/${id}/`);
        const data: GuitarTab = response.data;
        setTab(data);

        // Set editable fields
        setEditedTitle(data.title);
        setEditedArtist(data.artist);

        // If data has lines, use them; otherwise, a single default line
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

        // Also initialize newNoteInputs
        const inputs = loadedLines.map((line) =>
          line.strings.map(() => ({ fret: "", position: "" }))
        );
        setNewNoteInputs(inputs);

        // Initialize history with this starting point
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

  // ----------------------------
  // ADD A NEW "LINE" OF TABS
  // ----------------------------
  const handleAddLine = () => {
    // 1) snapshot the current lines
    snapshotLines();

    // 2) do the mutation
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

    // Also update newNoteInputs
    setNewNoteInputs((prev) => [
      ...prev,
      newLine.strings.map(() => ({ fret: "", position: "" })),
    ]);
  };

  // ----------------------------
  // UPDATE TYPED INPUTS
  // ----------------------------
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

  // ----------------------------
  // PRESS ENTER => ADD ALL VALID NOTES IN THAT LINE
  // THEN CLEAR INPUTS FOR THAT LINE
  // ----------------------------
  const handleLineKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    lineIndex: number
  ) => {
    if (e.key === "Enter") {
      // Check if we have at least one valid note to add
      const hasAnyValidNote = newNoteInputs[lineIndex].some((entry) => {
        const fretValue = parseInt(entry.fret, 10);
        const posValue = parseInt(entry.position, 10);
        return !isNaN(fretValue) && !isNaN(posValue);
      });

      if (!hasAnyValidNote) {
        // No valid notes to add, do nothing
        return;
      }

      // 1) snapshot
      snapshotLines();

      // 2) do the mutation
      const updatedLines = [...lines];
      const updatedInputs = [...newNoteInputs];

      updatedInputs[lineIndex].forEach((entry, stringIdx) => {
        const fretValue = parseInt(entry.fret, 10);
        const posValue = parseInt(entry.position, 10);

        if (!isNaN(fretValue) && !isNaN(posValue)) {
          // Check for duplicates on the same string
          const alreadyExists = updatedLines[lineIndex].strings[
            stringIdx
          ].notes.some((note) => note.position === posValue);

          if (!alreadyExists) {
            const newNote: Note = { fret: fretValue, position: posValue };
            updatedLines[lineIndex].strings[stringIdx].notes.push(newNote);
          }
        }
        // Always clear the input
        updatedInputs[lineIndex][stringIdx] = { fret: "", position: "" };
      });

      setLines(updatedLines);
      setNewNoteInputs(updatedInputs);
    }
  };

  // ----------------------------
  // HANDLE NOTE CLICK => Possibly connect
  // ----------------------------
  const handleNoteClick = (
    lineIndex: number,
    stringIndex: number,
    noteIndex: number
  ) => {
    // If we haven't selected a "from" note yet, store this one
    if (!selectedNote) {
      setSelectedNote({ lineIndex, stringIndex, noteIndex });
      return;
    }

    // If we do have a selected note AND a technique, connect
    if (techniqueType) {
      // If the user clicked the same note, ignore
      if (
        lineIndex === selectedNote.lineIndex &&
        stringIndex === selectedNote.stringIndex &&
        noteIndex === selectedNote.noteIndex
      ) {
        alert("Cannot connect a note to itself.");
        return;
      }

      // 1) snapshot
      snapshotLines();

      // 2) do the mutation
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

      // Clear selection
      setSelectedNote(null);
      setTechniqueType(null);
    }
  };

  // ----------------------------
  // SAVE CHANGES
  // ----------------------------
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
      // We don't snapshot here, but you could if you wanted
    } catch (error: any) {
      console.error("Error updating tab:", error);
      if (error.response && error.response.status === 401) {
        navigate("/login");
      }
    }
  };

  // ----------------------------
  // DELETE TAB
  // ----------------------------
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

  // ----------------------------------------------------------------
  // RENDER
  // ----------------------------------------------------------------
  if (loading) {
    return (
      <div className="relative flex min-h-screen bg-[#EFF1F7]">
        <Sidebar />
        <div className={`flex-1 ${isMobile ? "ml-0" : "md:ml-64"}`}>
          <div className="p-6">Loading tab details...</div>
        </div>
      </div>
    );
  }

  if (!tab) {
    return (
      <div className="relative flex min-h-screen bg-[#EFF1F7]">
        <Sidebar />
        <div className={`flex-1 ${isMobile ? "ml-0" : "md:ml-64"}`}>
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
      <div className={`flex-1 ${isMobile ? "ml-0" : "md:ml-64"}`}>
        <Header /> {/* Global Header */}
        <div className="p-6">
          {/* BACK BUTTON */}
          <button
            onClick={() => navigate("/guitar-tabs")}
            className="flex items-center gap-2 text-blue-600 mb-4 hover:text-blue-800"
          >
            <ArrowLeft className="h-5 w-5" />
            Back to Guitar Tabs
          </button>

          <Card className="p-6 bg-white">
            {/* HEADER (Title / Artist / Buttons) */}
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

              <div className="flex flex-wrap items-center gap-3">
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

                    {/* Undo button */}
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

            {/* Technique Buttons (only in edit mode) */}
            {editMode && (
              <div className="flex items-center gap-2 mb-4">
                <p className="font-medium text-sm">Select Technique:</p>
                <button
                  onClick={() => setTechniqueType("slide")}
                  className={`px-2 py-1 rounded text-sm ${
                    techniqueType === "slide"
                      ? "bg-blue-500 text-white"
                      : "bg-gray-200"
                  }`}
                >
                  Slide
                </button>
                <button
                  onClick={() => setTechniqueType("hammerOn")}
                  className={`px-2 py-1 rounded text-sm ${
                    techniqueType === "hammerOn"
                      ? "bg-blue-500 text-white"
                      : "bg-gray-200"
                  }`}
                >
                  H.O.
                </button>
                <button
                  onClick={() => setTechniqueType("pullOff")}
                  className={`px-2 py-1 rounded text-sm ${
                    techniqueType === "pullOff"
                      ? "bg-blue-500 text-white"
                      : "bg-gray-200"
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

            {/* TAB LINES */}
            {editMode ? (
              // EDIT MODE
              <div className="space-y-8">
                {lines.map((line, lineIndex) => (
                  <div
                    key={lineIndex}
                    className="border border-gray-200 rounded bg-gray-50 p-4"
                  >
                    <h2 className="font-semibold mb-4">Line {lineIndex + 1}</h2>

                    <div className="flex flex-col md:flex-row gap-4">
                      {/* NOTE ENTRY FIELDS */}
                      <div className="md:w-1/3 space-y-6">
                        {line.strings.map((stringData, stringIdx) => (
                          <div
                            key={stringIdx}
                            className="p-2 bg-white rounded border"
                          >
                            <h3 className="font-medium mb-2">
                              String {stringData.string}
                            </h3>
                            {/* Fret/Position pair */}
                            <div className="flex items-center gap-4 mb-2">
                              <div className="flex flex-col items-center">
                                <label className="text-xs">Fret</label>
                                <input
                                  type="number"
                                  className="border border-gray-300 rounded w-12 text-center"
                                  value={newNoteInputs[lineIndex][stringIdx].fret}
                                  onChange={(e) =>
                                    handleChangeInput(
                                      lineIndex,
                                      stringIdx,
                                      "fret",
                                      e.target.value
                                    )
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
                                  value={
                                    newNoteInputs[lineIndex][stringIdx].position
                                  }
                                  onChange={(e) =>
                                    handleChangeInput(
                                      lineIndex,
                                      stringIdx,
                                      "position",
                                      e.target.value
                                    )
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

                      {/* PREVIEW (right side) */}
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

                {/* + Add Another Line */}
                <button
                  type="button"
                  onClick={handleAddLine}
                  className="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600"
                >
                  + Add Another Line
                </button>
              </div>
            ) : (
              // VIEW MODE (read-only)
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

            {/* TIMESTAMPS */}
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
