import { useState, useEffect } from "react";
import { useDiaryStore } from "@/stores/diaryStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  ChevronLeft,
  ChevronRight,
  Search,
  X,
  BookOpen,
  PenLine,
  MapPin,
} from "lucide-react";
import { cn } from "@/lib/utils";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  const {
    selectedDate,
    loadEntry,
    entriesInMonth,
    loadEntriesForMonth,
    searchQuery,
    searchResults,
    isSearching,
    search,
    clearSearch,
    showSearch,
    toggleSearch,
    currentEntry,
    createNewEntry,
    location,
  } = useDiaryStore();

  const [viewDate, setViewDate] = useState(selectedDate);
  const [localSearchQuery, setLocalSearchQuery] = useState(searchQuery);

  // Update view date when selected date changes
  useEffect(() => {
    setViewDate(selectedDate);
  }, [selectedDate]);

  // Load entries when view month changes
  useEffect(() => {
    const year = viewDate.getFullYear().toString();
    const month = (viewDate.getMonth() + 1).toString().padStart(2, "0");
    loadEntriesForMonth(year, month);
  }, [viewDate, loadEntriesForMonth]);

  const goToPreviousMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));
  };

  const goToToday = () => {
    const today = new Date();
    setViewDate(today);
    loadEntry(today);
  };

  const selectDay = (day: number) => {
    const newDate = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
    loadEntry(newDate);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    search(localSearchQuery);
  };

  const handleSearchResultClick = (dateStr: string) => {
    const [year, month, day] = dateStr.split("-").map(Number);
    const date = new Date(year, month - 1, day);
    loadEntry(date);
    clearSearch();
  };

  // Generate calendar grid
  const generateCalendarDays = () => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    const days: Array<{ day: number; isCurrentMonth: boolean; hasEntry: boolean }> = [];

    // Previous month's trailing days
    for (let i = firstDay - 1; i >= 0; i--) {
      days.push({
        day: daysInPrevMonth - i,
        isCurrentMonth: false,
        hasEntry: false,
      });
    }

    // Current month's days
    for (let i = 1; i <= daysInMonth; i++) {
      const dayStr = i.toString().padStart(2, "0");
      days.push({
        day: i,
        isCurrentMonth: true,
        hasEntry: entriesInMonth.includes(dayStr),
      });
    }

    // Next month's leading days
    const remainingDays = 42 - days.length;
    for (let i = 1; i <= remainingDays; i++) {
      days.push({
        day: i,
        isCurrentMonth: false,
        hasEntry: false,
      });
    }

    return days;
  };

  const isToday = (day: number) => {
    const today = new Date();
    return (
      day === today.getDate() &&
      viewDate.getMonth() === today.getMonth() &&
      viewDate.getFullYear() === today.getFullYear()
    );
  };

  const isSelected = (day: number) => {
    return (
      day === selectedDate.getDate() &&
      viewDate.getMonth() === selectedDate.getMonth() &&
      viewDate.getFullYear() === selectedDate.getFullYear()
    );
  };

  return (
    <div className={cn("flex flex-col h-full bg-muted/30", className)}>
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-lg font-semibold flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Diary
          </h1>
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSearch}
            className="h-8 w-8"
          >
            {showSearch ? <X className="h-4 w-4" /> : <Search className="h-4 w-4" />}
          </Button>
        </div>

        {/* Search */}
        {showSearch && (
          <form onSubmit={handleSearch} className="mb-4">
            <div className="flex gap-2">
              <Input
                type="text"
                placeholder="Search entries..."
                value={localSearchQuery}
                onChange={(e) => setLocalSearchQuery(e.target.value)}
                className="h-9 text-sm"
              />
              <Button type="submit" size="sm" disabled={isSearching}>
                {isSearching ? "..." : "Go"}
              </Button>
            </div>
          </form>
        )}

        {/* Location indicator */}
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <MapPin className="h-3 w-3" />
          <span className="truncate">{location}</span>
        </div>
      </div>

      {/* Search Results or Calendar */}
      {showSearch && searchResults.length > 0 ? (
        <ScrollArea className="flex-1">
          <div className="p-2 space-y-1">
            <div className="text-xs text-muted-foreground px-2 py-1">
              {searchResults.length} result(s)
            </div>
            {searchResults.map((result) => (
              <button
                key={result.path}
                onClick={() => handleSearchResultClick(result.date)}
                className="w-full text-left p-2 rounded hover:bg-muted transition-colors"
              >
                <div className="text-sm font-medium">{result.date}</div>
                <div className="text-xs text-muted-foreground truncate">
                  {result.snippet}
                </div>
              </button>
            ))}
          </div>
        </ScrollArea>
      ) : (
        <>
          {/* Calendar Header */}
          <div className="p-4 pb-2">
            <div className="flex items-center justify-between mb-4">
              <Button variant="ghost" size="icon" onClick={goToPreviousMonth}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="text-sm font-medium">
                {MONTHS[viewDate.getMonth()]} {viewDate.getFullYear()}
              </div>
              <Button variant="ghost" size="icon" onClick={goToNextMonth}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            {/* Day headers */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {DAYS.map((day) => (
                <div
                  key={day}
                  className="text-center text-xs text-muted-foreground font-medium py-1"
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-7 gap-1">
              {generateCalendarDays().map((item, index) => (
                <button
                  key={index}
                  onClick={() => item.isCurrentMonth && selectDay(item.day)}
                  disabled={!item.isCurrentMonth}
                  className={cn(
                    "aspect-square flex items-center justify-center text-xs rounded-full transition-colors relative",
                    item.isCurrentMonth
                      ? "hover:bg-muted cursor-pointer"
                      : "text-muted-foreground/30 cursor-default",
                    isToday(item.day) && item.isCurrentMonth && "ring-1 ring-primary",
                    isSelected(item.day) && item.isCurrentMonth && "bg-primary text-primary-foreground",
                    item.hasEntry && item.isCurrentMonth && !isSelected(item.day) && "font-semibold"
                  )}
                >
                  {item.day}
                  {item.hasEntry && item.isCurrentMonth && !isSelected(item.day) && (
                    <span className="absolute bottom-0.5 w-1 h-1 rounded-full bg-primary" />
                  )}
                </button>
              ))}
            </div>
          </div>

          <Separator />

          {/* Actions */}
          <div className="p-4 space-y-2">
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start"
              onClick={goToToday}
            >
              <PenLine className="h-4 w-4 mr-2" />
              Today
            </Button>

            {!currentEntry && (
              <Button
                variant="default"
                size="sm"
                className="w-full justify-start"
                onClick={createNewEntry}
              >
                <PenLine className="h-4 w-4 mr-2" />
                New Entry
              </Button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
