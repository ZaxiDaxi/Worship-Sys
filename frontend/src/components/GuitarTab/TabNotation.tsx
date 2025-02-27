import React from "react";

// Extend the Note interface to include an optional connection
interface NoteConnection {
  type: "slide" | "hammerOn" | "pullOff";
  connectedString: number;    // e.g. 1..6
  connectedFret: number;
  connectedPosition: number;
}

interface Note {
  fret: number;
  position: number;
  connection?: NoteConnection;
}

interface StringData {
  string: number; // 1 = high E, 6 = low E
  notes: Note[];
}

interface TabData {
  strings: StringData[];
}

interface TabProps {
  tabData?: TabData;
  editMode?: boolean;
  onNoteClick?: (stringIndex: number, noteIndex: number) => void;
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
}) => {
  // Basic layout constants
  const viewBoxWidth = 1000;
  const leftMargin = 40;
  const rightMargin = 40;
  const noteSpacing = 50; // horizontal spacing per 'position'
  const stringCount = 6;
  const stringSpacing = 20;
  const totalHeight = (stringCount + 1) * stringSpacing;

  // Utility: given a note and which stringIndex it’s on, return its (x,y) in the SVG
  const getNoteCoords = (note: Note, stringIndex: number) => {
    const x = leftMargin + note.position * noteSpacing;
    // If stringIndex = 0 => bottom line? or top line? 
    // We’ll keep your existing approach: y = (6 - stringIndex)*spacing
    const y = stringSpacing * (stringCount - stringIndex);
    return { x, y };
  };

  // A small helper to build a smooth arc path between two points
  // We'll do a simple "quadratic curve" with a single control point above the midpoint
  function buildArcPath(x1: number, y1: number, x2: number, y2: number) {
    const mx = (x1 + x2) / 2;          // midpoint X
    const my = (y1 + y2) / 2;          // midpoint Y
    const arcHeight = 15;              // how "high" the arc goes
    // M x1,y1 Q mx,(my - arcHeight) x2,y2
    return `M ${x1},${y1} Q ${mx},${my - arcHeight} ${x2},${y2}`;
  }

  return (
    <div className="font-mono text-base relative w-full">
      <svg
        width="100%"
        height="auto"
        viewBox={`0 0 ${viewBoxWidth} ${totalHeight}`}
        preserveAspectRatio="xMinYMin meet"
      >
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

        {/* Loop over each string, each note */}
        {tabData.strings.map((stringData, stringIndex) => {
          return stringData.notes.map((note, noteIndex) => {
            const { x: x1, y: y1 } = getNoteCoords(note, stringIndex);

            // We'll return a <g> that may contain:
            // 1) The connection arc/line if note.connection exists
            // 2) The note label <text>
            const groupElements: React.ReactNode[] = [];

            // If this note is connected to another note
            if (note.connection) {
              // Find the connected note's string array
              const connectedStringIndex = tabData.strings.findIndex(
                (s) => s.string === note.connection!.connectedString
              );
              if (connectedStringIndex !== -1) {
                // Find the actual connected note
                const connectedNote = tabData.strings[
                  connectedStringIndex
                ].notes.find(
                  (cn) =>
                    cn.fret === note.connection!.connectedFret &&
                    cn.position === note.connection!.connectedPosition
                );
                if (connectedNote) {
                  // Coordinates of the "to" note
                  const { x: x2, y: y2 } = getNoteCoords(
                    connectedNote,
                    connectedStringIndex
                  );

                  // Decide how to draw depending on technique
                  if (note.connection.type === "slide") {
                    // Straight line for slide
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
                    // Hammer-on or Pull-off => draw an arc with "H" or "P" above
                    const arcPath = buildArcPath(x1, y1, x2, y2);
                    const label =
                      note.connection.type === "hammerOn" ? "H" : "P";

                    // Add the arc path
                    groupElements.push(
                      <path
                        key={`arc-${stringIndex}-${noteIndex}`}
                        d={arcPath}
                        stroke="black"
                        fill="none"
                        strokeWidth={1}
                      />
                    );

                    // Put the label near the midpoint of the arc
                    const mx = (x1 + x2) / 2;
                    const my = (y1 + y2) / 2;
                    const labelX = mx;
                    const labelY = my - 20; // shift upward a bit above arc

                    groupElements.push(
                      <text
                        key={`arc-label-${stringIndex}-${noteIndex}`}
                        x={labelX}
                        y={labelY}
                        textAnchor="middle"
                        fontSize="14"
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

            // Now draw the note itself (the fret number)
            groupElements.push(
              <text
                key={`note-${stringIndex}-${noteIndex}`}
                x={x1}
                y={y1}
                textAnchor="middle"
                dominantBaseline="middle"
                fill="black"
                fontSize="14"
                style={{ cursor: editMode ? "pointer" : "default" }}
                onClick={() => {
                  if (editMode && onNoteClick) {
                    onNoteClick(stringIndex, noteIndex);
                  }
                }}
              >
                {note.fret}
              </text>
            );

            return (
              <g key={`group-${stringIndex}-${noteIndex}`}>
                {groupElements}
              </g>
            );
          });
        })}
      </svg>
    </div>
  );
};
