import { useDiaryStore } from "@/stores/diaryStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Calendar, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface OnThisDayProps {
  className?: string;
}

export function OnThisDay({ className }: OnThisDayProps) {
  const { pastEntries, isPastEntriesLoading, selectedDate } = useDiaryStore();

  const formattedDate = selectedDate.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
  });

  if (isPastEntriesLoading) {
    return (
      <div className={cn("p-4", className)}>
        <div className="flex items-center gap-2 mb-4">
          <Clock className="h-5 w-5 text-muted-foreground animate-pulse" />
          <span className="text-sm text-muted-foreground">Loading memories...</span>
        </div>
      </div>
    );
  }

  if (pastEntries.length === 0) {
    return (
      <div className={cn("p-4", className)}>
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="h-5 w-5 text-muted-foreground" />
          <h3 className="font-semibold text-sm">On This Day</h3>
        </div>
        <p className="text-sm text-muted-foreground">
          No entries from previous years on {formattedDate}.
        </p>
      </div>
    );
  }

  return (
    <ScrollArea className={cn("h-full", className)}>
      <div className="p-4 space-y-4">
        <div className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-primary" />
          <h3 className="font-semibold text-sm">On This Day</h3>
          <span className="text-xs text-muted-foreground">
            ({pastEntries.length} {pastEntries.length === 1 ? "entry" : "entries"})
          </span>
        </div>

        <div className="space-y-3">
          {pastEntries.map((entry) => {
            const yearsAgo = selectedDate.getFullYear() - parseInt(entry.year);
            return (
              <Card key={entry.path} className="bg-muted/30 border-muted">
                <CardHeader className="pb-2 pt-3 px-3">
                  <CardTitle className="text-sm font-medium flex items-center justify-between">
                    <span>{entry.year}</span>
                    <span className="text-xs text-muted-foreground font-normal">
                      {yearsAgo} {yearsAgo === 1 ? "year" : "years"} ago
                    </span>
                  </CardTitle>
                </CardHeader>
                <Separator className="mb-2" />
                <CardContent className="px-3 pb-3">
                  <pre className="text-xs text-muted-foreground whitespace-pre-wrap font-mono leading-relaxed max-h-48 overflow-y-auto">
                    {entry.content.trim()}
                  </pre>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </ScrollArea>
  );
}
