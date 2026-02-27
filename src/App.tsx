import { useEffect } from "react";
import { useDiaryStore } from "@/stores/diaryStore";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { Sidebar } from "@/components/Sidebar";
import { Editor } from "@/components/Editor";
import { OnThisDay } from "@/components/OnThisDay";
import { EntryHeader } from "@/components/EntryHeader";
import { EmptyState } from "@/components/EmptyState";
import { Separator } from "@/components/ui/separator";

function App() {
  const {
    loadEntry,
    fetchCurrentLocation,
    currentEntry,
    showOnThisDay,
    pastEntries,
    isLoading,
  } = useDiaryStore();

  // Keyboard shortcuts
  useKeyboardShortcuts();

  // Initial load
  useEffect(() => {
    const today = new Date();
    fetchCurrentLocation();
    loadEntry(today);
  }, []);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background">
      {/* Sidebar - Calendar & Search */}
      <aside className="w-72 border-r flex-shrink-0">
        <Sidebar />
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0">
        <EntryHeader />

        <div className="flex-1 flex overflow-hidden">
          {/* Editor or Empty State */}
          <div className="flex-1 overflow-hidden">
            {currentEntry ? (
              <Editor />
            ) : isLoading ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-muted-foreground animate-pulse">Loading...</div>
              </div>
            ) : (
              <EmptyState />
            )}
          </div>

          {/* On This Day Panel */}
          {showOnThisDay && pastEntries.length > 0 && (
            <>
              <Separator orientation="vertical" />
              <aside className="w-80 flex-shrink-0 border-l bg-muted/20">
                <OnThisDay />
              </aside>
            </>
          )}
        </div>
      </main>
    </div>
  );
}

export default App;
