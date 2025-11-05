import React, { useState, useEffect, useRef } from "react";
import { IconButton } from "@mui/material";
import AddCircleIcon from "@mui/icons-material/AddCircle";
import { useIsMobile } from "@/hooks/use-mobile";
import { splitLineByWordsWithIndex } from "./songUtils";

/* ------------------------------------------------------------------ */
/* Shared types: shape of a chord and a single lyric line              */
/* ------------------------------------------------------------------ */
interface Chord {
  chord: string;     // e.g., "Am", "F#7", "C/E"
  position: number;  // 0-based character index in the lyric line where this chord anchors
}

export interface LyricLine {
  text: string;      // the raw lyric text for this line
  chords: Chord[];   // list of chord anchors for this line
}

/* ------------------------------------------------------------------ */
/* Component props                                                     */
/* ------------------------------------------------------------------ */
interface ChordLineProps {
  line: LyricLine;                                   // the current line's data from parent
  editable: boolean;                                 // whether to render in edit mode or view mode
  onChange?: (text: string, chords: Chord[]) => void; // bubble up changes to parent (controlled pattern)
  /** Called when the “add above” button is clicked (parent decides how to insert a new line above). */
  onAddAbove?: () => void;
}

/* ------------------------------------------------------------------ */
/* ChordLine                                                           */
/* ------------------------------------------------------------------ */
const ChordLine: React.FC<ChordLineProps> = ({
  line,
  editable,
  onChange,
  onAddAbove,
}) => {
  /* ----------------------------- Local state ----------------------------- */
  const [text, setText] = useState(line.text);                // local copy of lyric text for editing
  const [chords, setChords] = useState<Chord[]>(line.chords); // local copy of chords for editing
  const [showLyricEditor, setShowLyricEditor] = useState(false); // toggle textarea visibility
  const textAreaRef = useRef<HTMLTextAreaElement>(null);         // ref for autoresize
  const isMobile = useIsMobile();                                // screen-size hint for chord vertical offset

  /* -------------------------- Sync props → state ------------------------- */
  // If the parent passes a new line object, mirror it into our local state.
  // This keeps the editor in sync with external updates (e.g., undo/redo from parent).
  useEffect(() => {
    setText(line.text);
    setChords(line.chords);
  }, [line]);

  /* --------------------------- Autoresize textarea ----------------------- */
  // When the textarea is visible and its content changes, resize it to fit content.
  useEffect(() => {
    if (editable && showLyricEditor && textAreaRef.current) {
      textAreaRef.current.style.height = "auto"; // reset before measuring
      textAreaRef.current.style.height =
        textAreaRef.current.scrollHeight + "px"; // expand to content height
    }
  }, [editable, showLyricEditor, text]);

  /* ------------------------------- Handlers ------------------------------ */
  // Update lyric text. We also shift chord positions by the length delta so
  // anchored chords remain aligned to the same *relative* character in the string.
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value;
    const diff = newText.length - text.length; // +n for insertions, -n for deletions

    // Shift every chord's position by the same delta, clamped to [0, newText.length]
    const updated = chords.map((c) => ({
      ...c,
      position: Math.max(0, Math.min(newText.length, c.position + diff)),
    }));

    setText(newText);
    setChords(updated);
    onChange?.(newText, updated); // notify parent
  };

  // Update a single chord's field (symbol or position)
  const handleChordChange = (
    index: number,
    field: "chord" | "position",
    value: string | number
  ) => {
    const updated = [...chords];
    if (field === "chord") {
      updated[index].chord = value as string;
    } else {
      // Coerce and clamp to lyric bounds
      const pos = Math.max(0, Math.min(text.length, Number(value)));
      updated[index].position = pos;
    }
    setChords(updated);
    onChange?.(text, updated); // notify parent with current text and chords
  };

  // Append a blank chord anchor at position 0 (user can edit afterward)
  const addChord = () => {
    const updated = [...chords, { chord: "", position: 0 }];
    setChords(updated);
    onChange?.(text, updated);
  };

  /* =============================== RENDER ================================= */

  /* ------------------------------ VIEW MODE ------------------------------- */
  if (!editable) {
    // Split the lyric into tokens with their start index so we can place chords above the correct chars.
    const tokens = splitLineByWordsWithIndex(text);
    return (
      <div
        className="font-mono text-sm md:text-base leading-[2.5] md:leading-[3.4] flex flex-wrap"
        style={{ marginBottom: "0.5rem" }}
      >
        {tokens.map((tok, i) => {
          // Chords whose anchor position falls within this token's [start, end)
          const tokenChords = chords.filter(
            (c) => c.position >= tok.start && c.position < tok.start + tok.token.length
          );
          return (
            <span
              key={i}
              className="relative inline-block whitespace-pre"
              style={{ marginRight: "4px" }}
            >
              {/* Absolutely position each chord above the token, horizontal offset in monospace "ch" units */}
              {tokenChords.map((c, idx) => {
                const rel = c.position - tok.start; // relative char index within token
                return (
                  <span
                    key={idx}
                    className="absolute text-blue-600 text-sm md:text-base"
                    style={{
                      left: `${rel}ch`,                   // align by character column
                      top: isMobile ? "-0.9em" : "-1.1em", // slightly different vertical offset on mobile
                    }}
                  >
                    {c.chord}
                  </span>
                );
              })}

              {/* Actual lyric token */}
              <span>{tok.token}</span>
            </span>
          );
        })}
      </div>
    );
  }

  /* ------------------------------ EDIT MODE ------------------------------- */
  const tokens = splitLineByWordsWithIndex(text);
  return (
    <div className="relative space-y-4 w-full pb-4 border-b border-gray-200 mb-4">
      {/* Optional "Add line above" affordance (parent wires onAddAbove) */}
      {editable && onAddAbove && (
        <IconButton
          onClick={onAddAbove}
          title="Add line above"
          size="small"
          sx={{
            position: "absolute",
            left: -28,               // nudge the button outside the editor box
            top: 0,
            color: "#6B46C1",       // Tailwind purple-600
            "&:hover": { color: "#553C9A" }, // purple-700
          }}
        >
          <AddCircleIcon fontSize="small" />
        </IconButton>
      )}

      {/* Chord+lyric overlay box: shows chords positioned above the monospace lyric */}
      <div
        className="font-mono text-sm md:text-base leading-[2.5] md:leading-[3.4] flex flex-wrap border border-gray-300 p-2 rounded"
        style={{ marginBottom: "0.5rem" }}
      >
        {tokens.map((tok, i) => {
          const tokenChords = chords.filter(
            (c) => c.position >= tok.start && c.position < tok.start + tok.token.length
          );
          return (
            <span
              key={i}
              className="relative inline-block whitespace-pre"
              style={{ marginRight: "4px" }}
            >
              {tokenChords.map((c, idx) => {
                const rel = c.position - tok.start;
                return (
                  <span
                    key={idx}
                    className="absolute text-blue-600"
                    style={{ left: `${rel}ch`, top: "-1.2em" }}
                  >
                    {c.chord}
                  </span>
                );
              })}
              <span>{tok.token}</span>
            </span>
          );
        })}
      </div>

      {/* Toggle lyric textarea visibility */}
      <button
        type="button"
        onClick={() => setShowLyricEditor((prev) => !prev)}
        className="px-3 py-1 rounded bg-gray-200 hover:bg-gray-300 text-sm font-medium"
      >
        {showLyricEditor ? "Hide Editor" : "Change Lyric"}
      </button>

      {/* Transparent textarea layered below the overlay box for editing raw text */}
      {showLyricEditor && (
        <textarea
          ref={textAreaRef}
          value={text}
          onChange={handleTextChange}
          maxLength={300}
          rows={3}
          className="w-full min-h-[100px] max-h-[300px] text-sm md:text-base font-mono border border-gray-300 outline-none rounded px-2 py-1 leading-[2.5] md:leading-[3.4] whitespace-pre-wrap resize-none overflow-hidden mt-2"
          style={{ color: "black", caretColor: "black" }}
        />
      )}

      {/* Chord editors: one row per chord with text (symbol) and numeric position */}
      <div className="flex flex-col space-y-2">
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

            {/* Show + button only on the last row to append a new chord */}
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

export default ChordLine;
