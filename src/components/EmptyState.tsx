import { useDiaryStore } from "@/stores/diaryStore";
import { Button } from "@/components/ui/button";
import { PenLine, BookOpen } from "lucide-react";
import { formatDate } from "@/lib/utils";

export function EmptyState() {
  const { selectedDate, createNewEntry, isLoading } = useDiaryStore();

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
        <div className="animate-pulse">Loading...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center h-full p-8 text-center">
      <div className="rounded-full bg-muted p-4 mb-4">
        <BookOpen className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold mb-2">No Entry Yet</h3>
      <p className="text-muted-foreground mb-6 max-w-sm">
        You haven't written anything for {formatDate(selectedDate)}. Start capturing your thoughts!
      </p>
      <Button onClick={createNewEntry} className="gap-2">
        <PenLine className="h-4 w-4" />
        Start Writing
      </Button>
    </div>
  );
}
