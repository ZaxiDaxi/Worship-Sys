// ChordLine.tsx

import React, { useState, useEffect, useRef } from "react";
import { IconButton } from "@mui/material";
import AddCircleIcon from "@mui/icons-material/AddCircle";
import { useIsMobile } from "@/hooks/use-mobile";
import { splitLineByWordsWithIndex } from "./songUtils";

interface Chord {
  chord: string;
  position: number;
}

export interface LyricLine {
  text: string;
  chords: Chord[];
}

interface ChordLineProps {
  line: LyricLine;
  editable: boolean;
  onChange?: (text: string, chords: Chord[]) => void;
}

const ChordLine: React.FC<ChordLineProps> = ({ line, editable, onChange }) => {
  const [text, setText] = useState(line.text);
  const [chords, setChords] = useState<Chord[]>(line.chords);
  const [showLyricEditor, setShowLyricEditor] = useState(false);
  const textAreaRef = useRef<HTMLTextAreaElement>(null);
  const isMobile = useIsMobile();

  useEffect(() => {
    setText(line.text);
    setChords(line.chords);
  }, [line]);

  useEffect(() => {
    if (editable && showLyricEditor && textAreaRef.current) {
      textAreaRef.current.style.height = "auto";
      textAreaRef.current.style.height = textAreaRef.current.scrollHeight + "px";
    }
  }, [editable, showLyricEditor, text]);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value;
    const diff = newText.length - text.length;
    const updatedChords = chords.map((c) => ({
      ...c,
      position: Math.max(0, c.position + diff),
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

  // VIEW MODE
  if (!editable) {
    const tokens = splitLineByWordsWithIndex(text);
    return (
      <div className="font-mono text-sm md:text-base leading-[2.5] md:leading-[3.4] flex flex-wrap" style={{ marginBottom: "0.5rem" }}>
        {tokens.map((tokenObj, i) => {
          const tokenChords = chords.filter(
            (c) =>
              c.position >= tokenObj.start &&
              c.position < tokenObj.start + tokenObj.token.length
          );
          return (
            <span key={i} className="relative inline-block whitespace-pre" style={{ marginRight: "4px" }}>
              {tokenChords.map((ch, chordIdx) => {
                const relIndex = ch.position - tokenObj.start;
                return (
                  <span
                    key={chordIdx}
                    className="absolute text-blue-600 text-sm md:text-base"
                    style={{
                      left: `${relIndex}ch`,
                      top: isMobile ? "-0.9em" : "-1.1em",
                    }}
                  >
                    {ch.chord}
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

  // EDIT MODE
  const tokens = splitLineByWordsWithIndex(text);
  return (
    <div className="relative space-y-4 w-full pb-4 border-b border-gray-200 mb-4">
      {/* Top chord+lyric overlay */}
      <div className="font-mono text-sm md:text-base leading-[2.5] md:leading-[3.4] flex flex-wrap border border-gray-300 p-2 rounded" style={{ marginBottom: "0.5rem" }}>
        {tokens.map((tokenObj, i) => {
          const tokenChords = chords.filter(
            (c) =>
              c.position >= tokenObj.start &&
              c.position < tokenObj.start + tokenObj.token.length
          );
          return (
            <span key={i} className="relative inline-block whitespace-pre" style={{ marginRight: "4px" }}>
              {tokenChords.map((c, chordIdx) => {
                const relIndex = c.position - tokenObj.start;
                return (
                  <span
                    key={chordIdx}
                    className="absolute text-blue-600"
                    style={{
                      left: `${relIndex}ch`,
                      top: "-1.2em",
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

      {/* Toggle button for the transparent textarea */}
      <button
        type="button"
        onClick={() => setShowLyricEditor((prev) => !prev)}
        className="px-3 py-1 rounded bg-gray-200 hover:bg-gray-300 text-sm font-medium"
      >
        {showLyricEditor ? "Hide Editor" : "Change Lyric"}
      </button>

      {/* The transparent editor */}
      {showLyricEditor && (
        <div>
          <textarea
            ref={textAreaRef}
            value={text}
            onChange={handleTextChange}
            maxLength={300}
            rows={3}
            className="w-full min-h-[100px] max-h-[300px] text-sm md:text-base font-mono border border-gray-300 outline-none rounded px-2 py-1 leading-[2.5] md:leading-[3.4] whitespace-pre-wrap resize-none overflow-hidden mt-2"
            style={{
              color: "black",
              caretColor: "black",
            }}
          />
        </div>
      )}

      {/* Chord inputs */}
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
