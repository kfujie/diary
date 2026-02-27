import { create } from "zustand";
import {
  DiaryEntry,
  SearchResult,
  readEntry,
  writeEntry,
  createEntryWithTemplate,
  getPastEntries,
  searchEntries,
  getEntriesForMonth,
  fetchLocation,
} from "@/lib/tauri";
import { getDateParts } from "@/lib/utils";

interface DiaryState {
  // Current date selection
  selectedDate: Date;

  // Current entry
  currentEntry: DiaryEntry | null;
  isLoading: boolean;
  isSaving: boolean;
  hasUnsavedChanges: boolean;
  editorContent: string;

  // Past entries ("On This Day")
  pastEntries: DiaryEntry[];
  isPastEntriesLoading: boolean;

  // Search
  searchQuery: string;
  searchResults: SearchResult[];
  isSearching: boolean;

  // Calendar data
  entriesInMonth: string[];

  // Location
  location: string;

  // UI state
  showOnThisDay: boolean;
  showSearch: boolean;

  // Actions
  setSelectedDate: (date: Date) => void;
  loadEntry: (date: Date) => Promise<void>;
  saveEntry: () => Promise<void>;
  setEditorContent: (content: string) => void;
  loadPastEntries: () => Promise<void>;
  search: (query: string) => Promise<void>;
  clearSearch: () => void;
  loadEntriesForMonth: (year: string, month: string) => Promise<void>;
  fetchCurrentLocation: () => Promise<void>;
  toggleOnThisDay: () => void;
  toggleSearch: () => void;
  createNewEntry: () => Promise<void>;
}

export const useDiaryStore = create<DiaryState>((set, get) => ({
  // Initial state
  selectedDate: new Date(),
  currentEntry: null,
  isLoading: false,
  isSaving: false,
  hasUnsavedChanges: false,
  editorContent: "",
  pastEntries: [],
  isPastEntriesLoading: false,
  searchQuery: "",
  searchResults: [],
  isSearching: false,
  entriesInMonth: [],
  location: "Location unavailable",
  showOnThisDay: true,
  showSearch: false,

  setSelectedDate: (date: Date) => {
    set({ selectedDate: date });
  },

  loadEntry: async (date: Date) => {
    const state = get();

    // Save current entry if there are unsaved changes
    if (state.hasUnsavedChanges && state.currentEntry) {
      await state.saveEntry();
    }

    set({ isLoading: true });

    const { year, month, day } = getDateParts(date);

    try {
      const entry = await readEntry(year, month, day);
      set({
        currentEntry: entry,
        editorContent: entry.content,
        hasUnsavedChanges: false,
        selectedDate: date,
      });
    } catch {
      // Entry doesn't exist yet
      set({
        currentEntry: null,
        editorContent: "",
        hasUnsavedChanges: false,
        selectedDate: date,
      });
    } finally {
      set({ isLoading: false });
    }

    // Load entries for this month for calendar highlighting
    await get().loadEntriesForMonth(year, month);

    // Load past entries for "On This Day"
    await get().loadPastEntries();
  },

  saveEntry: async () => {
    const { selectedDate, editorContent } = get();
    const { year, month, day } = getDateParts(selectedDate);

    set({ isSaving: true });

    try {
      await writeEntry(year, month, day, editorContent);
      const entry = await readEntry(year, month, day);
      // Check if content changed during the async save to avoid losing edits
      const latestContent = get().editorContent;
      set({
        currentEntry: entry,
        hasUnsavedChanges: latestContent !== entry.content,
      });
    } catch (error) {
      console.error("Failed to save entry:", error);
    } finally {
      set({ isSaving: false });
    }
  },

  setEditorContent: (content: string) => {
    const { currentEntry } = get();
    const hasChanges = currentEntry ? content !== currentEntry.content : content !== "";
    set({ editorContent: content, hasUnsavedChanges: hasChanges });
  },

  loadPastEntries: async () => {
    const { selectedDate } = get();
    const { month, day } = getDateParts(selectedDate);
    const currentYear = selectedDate.getFullYear();

    set({ isPastEntriesLoading: true });

    try {
      const entries = await getPastEntries(month, day, currentYear);
      set({ pastEntries: entries });
    } catch (error) {
      console.error("Failed to load past entries:", error);
      set({ pastEntries: [] });
    } finally {
      set({ isPastEntriesLoading: false });
    }
  },

  search: async (query: string) => {
    set({ searchQuery: query, isSearching: true });

    if (!query.trim()) {
      set({ searchResults: [], isSearching: false });
      return;
    }

    try {
      const results = await searchEntries(query);
      set({ searchResults: results });
    } catch (error) {
      console.error("Search failed:", error);
      set({ searchResults: [] });
    } finally {
      set({ isSearching: false });
    }
  },

  clearSearch: () => {
    set({ searchQuery: "", searchResults: [], showSearch: false });
  },

  loadEntriesForMonth: async (year: string, month: string) => {
    try {
      const days = await getEntriesForMonth(year, month);
      set({ entriesInMonth: days });
    } catch {
      set({ entriesInMonth: [] });
    }
  },

  fetchCurrentLocation: async () => {
    try {
      const location = await fetchLocation();
      set({ location });
    } catch {
      set({ location: "Location unavailable" });
    }
  },

  toggleOnThisDay: () => {
    set((state) => ({ showOnThisDay: !state.showOnThisDay }));
  },

  toggleSearch: () => {
    set((state) => ({ showSearch: !state.showSearch, showOnThisDay: false }));
  },

  createNewEntry: async () => {
    const { selectedDate, location } = get();
    const { year, month, day } = getDateParts(selectedDate);

    set({ isLoading: true });

    try {
      const entry = await createEntryWithTemplate(year, month, day, location);
      set({
        currentEntry: entry,
        editorContent: entry.content,
        hasUnsavedChanges: false,
        isLoading: false,
      });

      // Reload entries for month
      await get().loadEntriesForMonth(year, month);
    } catch (error) {
      console.error("Failed to create entry:", error);
    } finally {
      set({ isLoading: false });
    }
  },
}));
