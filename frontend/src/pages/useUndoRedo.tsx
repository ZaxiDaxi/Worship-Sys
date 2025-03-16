import { useState, useCallback } from "react";

export function useUndoRedo<T>(initialValue: T) {
  const [past, setPast] = useState<T[]>([]);
  const [present, setPresent] = useState<T>(initialValue);
  const [future, setFuture] = useState<T[]>([]);

  // Update the state and record history
  const update = useCallback((newPresent: T) => {
    setPast((prev) => [...prev, present]);
    setPresent(newPresent);
    setFuture([]);
  }, [present]);

  // Undo: revert to the last state in history
  const undo = useCallback(() => {
    setPast((prevPast) => {
      if (prevPast.length === 0) return prevPast;
      const previous = prevPast[prevPast.length - 1];
      setFuture((prevFuture) => [present, ...prevFuture]);
      setPresent(previous);
      return prevPast.slice(0, -1);
    });
  }, [present]);

  // Redo: advance to the next state if available
  const redo = useCallback(() => {
    setFuture((prevFuture) => {
      if (prevFuture.length === 0) return prevFuture;
      const next = prevFuture[0];
      setPast((prevPast) => [...prevPast, present]);
      setPresent(next);
      return prevFuture.slice(1);
    });
  }, [present]);

  return { present, update, undo, redo, canUndo: past.length > 0, canRedo: future.length > 0 };
}
