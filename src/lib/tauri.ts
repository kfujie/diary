import { invoke } from "@tauri-apps/api/core";

export interface DiaryEntry {
  year: string;
  month: string;
  day: string;
  content: string;
  path: string;
}

export interface SearchResult {
  path: string;
  date: string;
  snippet: string;
}

export async function getDiaryRootPath(): Promise<string> {
  return invoke<string>("get_diary_root_path");
}

export async function readEntry(
  year: string,
  month: string,
  day: string
): Promise<DiaryEntry> {
  return invoke<DiaryEntry>("read_entry", { year, month, day });
}

export async function writeEntry(
  year: string,
  month: string,
  day: string,
  content: string
): Promise<string> {
  return invoke<string>("write_entry", { year, month, day, content });
}

export async function createEntryWithTemplate(
  year: string,
  month: string,
  day: string,
  location: string
): Promise<DiaryEntry> {
  return invoke<DiaryEntry>("create_entry_with_template", {
    year,
    month,
    day,
    location,
  });
}

export async function entryExists(
  year: string,
  month: string,
  day: string
): Promise<boolean> {
  return invoke<boolean>("entry_exists", { year, month, day });
}

export async function getPastEntries(
  month: string,
  day: string,
  currentYear: number
): Promise<DiaryEntry[]> {
  return invoke<DiaryEntry[]>("get_past_entries", {
    month,
    day,
    currentYear,
  });
}

export async function searchEntries(keyword: string): Promise<SearchResult[]> {
  return invoke<SearchResult[]>("search_entries", { keyword });
}

export async function getEntriesForMonth(
  year: string,
  month: string
): Promise<string[]> {
  return invoke<string[]>("get_entries_for_month", { year, month });
}

export async function getAllEntryDates(): Promise<string[]> {
  return invoke<string[]>("get_all_entry_dates");
}

export async function fetchLocation(): Promise<string> {
  try {
    return await invoke<string>("fetch_location");
  } catch {
    return "Location unavailable";
  }
}
