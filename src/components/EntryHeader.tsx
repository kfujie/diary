import { useDiaryStore } from "@/stores/diaryStore";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Save, Clock, CheckCircle2, PenLine, History } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/utils";

interface EntryHeaderProps {
  className?: string;
}

export function EntryHeader({ className }: EntryHeaderProps) {
  const {
    selectedDate,
    currentEntry,
    hasUnsavedChanges,
    isSaving,
    saveEntry,
    createNewEntry,
    showOnThisDay,
    toggleOnThisDay,
    pastEntries,
  } = useDiaryStore();

  const isToday =
    new Date().toDateString() === selectedDate.toDateString();

  return (
    <div className={cn("border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60", className)}>
      <div className="flex items-center justify-between px-6 py-3">
        {/* Date display */}
        <div className="flex items-center gap-3">
          <div>
            <h2 className="text-lg font-semibold">{formatDate(selectedDate)}</h2>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              {isToday && (
                <span className="flex items-center gap-1 text-primary">
                  <Clock className="h-3 w-3" />
                  Today
                </span>
              )}
              {currentEntry && (
                <span className="text-muted-foreground">
                  Entry exists
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {/* On This Day toggle */}
          {pastEntries.length > 0 && (
            <Button
              variant={showOnThisDay ? "secondary" : "ghost"}
              size="sm"
              onClick={toggleOnThisDay}
              className="gap-2"
            >
              <History className="h-4 w-4" />
              <span className="hidden sm:inline">On This Day</span>
              <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">
                {pastEntries.length}
              </span>
            </Button>
          )}

          <Separator orientation="vertical" className="h-6" />

          {/* Save status / New entry */}
          {currentEntry ? (
            <Button
              variant={hasUnsavedChanges ? "default" : "ghost"}
              size="sm"
              onClick={saveEntry}
              disabled={isSaving || !hasUnsavedChanges}
              className="gap-2"
            >
              {isSaving ? (
                <>
                  <Save className="h-4 w-4 animate-pulse" />
                  Saving...
                </>
              ) : hasUnsavedChanges ? (
                <>
                  <Save className="h-4 w-4" />
                  Save
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  Saved
                </>
              )}
            </Button>
          ) : (
            <Button
              variant="default"
              size="sm"
              onClick={createNewEntry}
              className="gap-2"
            >
              <PenLine className="h-4 w-4" />
              Create Entry
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
