import React, { useState } from "react";

// Extend the Note interface to include an optional connection and bending flag
interface NoteConnection {
  type: "slide" | "hammerOn" | "pullOff";
  connectedString: number; // e.g. 1..6
  connectedFret: number;
  connectedPosition: number;
}

export interface Note {
  fret: number;
  position: number;
  connection?: NoteConnection;
  isBending?: boolean; // indicates if a bending arrow should be shown
}

export interface StringData {
  string: number; // 1 = high E, 6 = low E
  notes: Note[];
}

export interface TabData {
  strings: StringData[];
}

interface TabProps {
  tabData?: TabData;
  editMode?: boolean;
  onNoteClick?: (stringIndex: number, noteIndex: number) => void;
  onBendToggle?: (stringIndex: number, noteIndex: number) => void;
}

export const TabNotation: React.FC<TabProps> = ({
  tabData = {
    strings: [
      { string: 1, notes: [{ fret: 0, position: 5 }] },
      { string: 2, notes: [] },
      { string: 3, notes: [{ fret: 0, position: 4 }] },
      { string: 4, notes: [{ fret: 0, position: 3 }] },
      { string: 5, notes: [{ fret: 0, position: 2 }] },
      { string: 6, notes: [{ fret: 0, position: 1 }] },
    ],
  },
  editMode = false,
  onNoteClick,
  onBendToggle,
}) => {
  // Local state to track which note is selected for bending
  const [selectedNote, setSelectedNote] = useState<{ stringIndex: number; noteIndex: number } | null>(null);

  // Basic layout constants
  const viewBoxWidth = 1000;
  const leftMargin = 40;
  const rightMargin = 40;
  const noteSpacing = 50; // horizontal spacing per 'position'
  const stringCount = 6;
  const stringSpacing = 20;
  const totalHeight = (stringCount + 1) * stringSpacing;

  // Compute (x, y) coordinates for a given note on its string
  const getNoteCoords = (note: Note, stringIndex: number) => {
    const x = leftMargin + note.position * noteSpacing;
    const y = stringSpacing * (stringCount - stringIndex);
    return { x, y };
  };

  // Helper to build an arc for connections (hammer-on or pull-off)
  function buildArcPath(x1: number, y1: number, x2: number, y2: number) {
    const mx = (x1 + x2) / 2;
    const my = (y1 + y2) / 2;
    const arcHeight = 15;
    return `M ${x1},${y1} Q ${mx},${my - arcHeight} ${x2},${y2}`;
  }

  // Handler for Toggle Bend – calls the parent's onBendToggle callback
  const handleToggleBend = () => {
    if (selectedNote && onBendToggle) {
      onBendToggle(selectedNote.stringIndex, selectedNote.noteIndex);
      setSelectedNote(null);
    }
  };

  return (
    <div className="font-mono text-base relative w-full">
      <svg
        width="100%"
        height="auto"
        viewBox={`0 0 ${viewBoxWidth} ${totalHeight}`}
        preserveAspectRatio="xMinYMin meet"
      >
        <defs>
          <marker
            id="arrowhead"
            markerWidth="10"
            markerHeight="7"
            refX="0"
            refY="3.5"
            orient="auto"
            markerUnits="strokeWidth"
          >
            <polygon points="0 0, 10 3.5, 0 7" fill="black" />
          </marker>
        </defs>

        {/* Draw horizontal lines for each string */}
        {Array.from({ length: stringCount }).map((_, i) => {
          const y = (i + 1) * stringSpacing;
          return (
            <line
              key={`string-${i}`}
              x1={leftMargin}
              y1={y}
              x2={viewBoxWidth - rightMargin}
              y2={y}
              stroke="rgba(0, 0, 0, 0.3)"
              strokeWidth={1}
            />
          );
        })}

        {/* Left boundary (nut) */}
        <line
          x1={leftMargin}
          y1={stringSpacing}
          x2={leftMargin}
          y2={stringCount * stringSpacing}
          stroke="rgba(0, 0, 0, 0.5)"
          strokeWidth={2}
        />

        {/* Right boundary (optional) */}
        <line
          x1={viewBoxWidth - rightMargin}
          y1={stringSpacing}
          x2={viewBoxWidth - rightMargin}
          y2={stringCount * stringSpacing}
          stroke="rgba(0, 0, 0, 0.3)"
          strokeWidth={1}
        />

        {/* Loop over each string and its notes */}
        {tabData.strings.map((stringData, stringIndex) =>
          stringData.notes.map((note, noteIndex) => {
            const { x: x1, y: y1 } = getNoteCoords(note, stringIndex);
            const groupElements: React.ReactNode[] = [];

            // Draw connection lines/arcs if the note is connected
            if (note.connection) {
              const connectedStringIndex = tabData.strings.findIndex(
                (s) => s.string === note.connection!.connectedString
              );
              if (connectedStringIndex !== -1) {
                const connectedNote = tabData.strings[connectedStringIndex].notes.find(
                  (cn) =>
                    cn.fret === note.connection!.connectedFret &&
                    cn.position === note.connection!.connectedPosition
                );
                if (connectedNote) {
                  const { x: x2, y: y2 } = getNoteCoords(connectedNote, connectedStringIndex);
                  if (note.connection.type === "slide") {
                    groupElements.push(
                      <line
                        key={`slide-line-${stringIndex}-${noteIndex}`}
                        x1={x1}
                        y1={y1}
                        x2={x2}
                        y2={y2}
                        stroke="black"
                        strokeWidth={1}
                      />
                    );
                  } else {
                    const arcPath = buildArcPath(x1, y1, x2, y2);
                    const label = note.connection.type === "hammerOn" ? "H" : "P";
                    groupElements.push(
                      <path key={`arc-${stringIndex}-${noteIndex}`} d={arcPath} stroke="black" fill="none" strokeWidth={1} />
                    );
                    const mx = (x1 + x2) / 2;
                    const my = (y1 + y2) / 2;
                    groupElements.push(
                      <text
                        key={`arc-label-${stringIndex}-${noteIndex}`}
                        x={mx}
                        y={my - 20}
                        textAnchor="middle"
                        fontSize="23"
                        fill="black"
                        style={{ fontWeight: "bold" }}
                      >
                        {label}
                      </text>
                    );
                  }
                }
              }
            }

            // Draw the bending arrow if isBending is true
            if (note.isBending) {
              groupElements.push(
                <path
                  key={`bend-arrow-${stringIndex}-${noteIndex}`}
                  d={`M ${x1},${y1} q 10 -30 10 -70`}
                  stroke="black"
                  fill="none"
                  strokeWidth={1.5}
                  markerEnd="url(#arrowhead)"
                />
              );
            }

            // Render the note (fret number)
            groupElements.push(
              <text
                key={`note-${stringIndex}-${noteIndex}`}
                x={x1}
                y={y1}
                textAnchor="middle"
                dominantBaseline="middle"
                fill="black"
                fontSize="25"
                style={{
                  cursor: editMode ? "pointer" : "default",
                  stroke:
                    selectedNote &&
                    selectedNote.stringIndex === stringIndex &&
                    selectedNote.noteIndex === noteIndex
                      ? "red"
                      : "none",
                  strokeWidth: 2,
                }}
                onClick={() => {
                  if (editMode) {
                    setSelectedNote({ stringIndex, noteIndex });
                    if (onNoteClick) onNoteClick(stringIndex, noteIndex);
                  }
                }}
              >
                {note.fret}
              </text>
            );

            return <g key={`group-${stringIndex}-${noteIndex}`}>{groupElements}</g>;
          })
        )}
      </svg>
      {/* Toggle Bend button appears when a note is selected in edit mode */}
      {editMode && selectedNote && (
        <button className="mt-4 px-4 py-2 bg-blue-500 text-white rounded" onClick={handleToggleBend}>
          Toggle Bend
        </button>
      )}
    </div>
  );
};
