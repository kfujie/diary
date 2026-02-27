import { useEffect } from "react";
import { useDiaryStore } from "@/stores/diaryStore";

export function useKeyboardShortcuts() {
  const { saveEntry, toggleSearch, toggleOnThisDay, loadEntry, selectedDate } =
    useDiaryStore();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + S: Save
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        saveEntry();
      }

      // Cmd/Ctrl + K: Toggle search
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        toggleSearch();
      }

      // Cmd/Ctrl + H: Toggle On This Day
      if ((e.metaKey || e.ctrlKey) && e.key === "h") {
        e.preventDefault();
        toggleOnThisDay();
      }

      // Cmd/Ctrl + T: Go to today
      if ((e.metaKey || e.ctrlKey) && e.key === "t") {
        e.preventDefault();
        loadEntry(new Date());
      }

      // Cmd/Ctrl + Left Arrow: Previous day
      if ((e.metaKey || e.ctrlKey) && e.key === "ArrowLeft") {
        e.preventDefault();
        const prevDay = new Date(selectedDate);
        prevDay.setDate(prevDay.getDate() - 1);
        loadEntry(prevDay);
      }

      // Cmd/Ctrl + Right Arrow: Next day
      if ((e.metaKey || e.ctrlKey) && e.key === "ArrowRight") {
        e.preventDefault();
        const nextDay = new Date(selectedDate);
        nextDay.setDate(nextDay.getDate() + 1);
        loadEntry(nextDay);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [saveEntry, toggleSearch, toggleOnThisDay, loadEntry, selectedDate]);
}
