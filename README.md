# Diary

A minimal, local-first diary desktop app built with Tauri, React, and Rust.

All entries are stored as plain text files on your machine — no cloud, no accounts, no tracking.

## Features

- **Markdown editor** — CodeMirror 6 with syntax highlighting, line numbers, and line wrapping
- **Auto-save** — entries save automatically after 2 seconds of inactivity
- **Calendar navigation** — visual calendar with highlighted days that have entries
- **"On This Day"** — view past entries from the same date in previous years
- **Full-text search** — search across all diary entries instantly
- **Location tagging** — automatically tags entries with your approximate location (via ipinfo.io)
- **Configurable storage** — choose where to store your diary entries via Settings
- **Keyboard-driven** — full set of shortcuts for fast navigation

### Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| `Cmd/Ctrl + S` | Save entry |
| `Cmd/Ctrl + K` | Toggle search |
| `Cmd/Ctrl + H` | Toggle "On This Day" panel |
| `Cmd/Ctrl + T` | Go to today |
| `Cmd/Ctrl + Left` | Previous day |
| `Cmd/Ctrl + Right` | Next day |

## Storage

Entries are plain `.txt` files organized by year and month:

```
<diary-root>/
  2025/
    01/
      2025-01-15.txt
    02/
      2025-02-27.txt
  2026/
    ...
```

By default, entries are stored in `~/Documents/Diary/`. You can change this to any folder via the **Settings** button (gear icon) in the sidebar. Your preference is saved to `~/.config/diary-app/settings.json` and persists across sessions.

Each new entry is created from a template:

```
Diary Entry for 2025-02-27

Beginning:

End:

Location: Tokyo, Tokyo, JP
```

You can customize the template in `src-tauri/src/lib.rs` (`DIARY_TEMPLATE`).

## Prerequisites

- [Node.js](https://nodejs.org/) (v18+)
- [Rust](https://www.rust-lang.org/tools/install) (latest stable)
- [Tauri CLI prerequisites](https://v2.tauri.app/start/prerequisites/) for your OS

## Setup

```bash
# Clone the repository
git clone https://github.com/kfujie/diary.git
cd diary

# Install frontend dependencies
npm install

# Run in development mode
npm run tauri dev

# Build for production
npm run tauri build
```

The built app will be at:
- **macOS**: `src-tauri/target/release/bundle/macos/Diary.app`
- **Windows**: `src-tauri/target/release/bundle/msi/`
- **Linux**: `src-tauri/target/release/bundle/deb/` or `appimage/`

## Tech Stack

| Layer | Technology |
|---|---|
| Desktop framework | [Tauri v2](https://v2.tauri.app/) |
| Frontend | [React 19](https://react.dev/) + TypeScript |
| Styling | [Tailwind CSS](https://tailwindcss.com/) |
| Editor | [CodeMirror 6](https://codemirror.net/) |
| State management | [Zustand](https://zustand.docs.pmnd.rs/) |
| Backend | Rust (Tokio, Reqwest, WalkDir) |
| Build tool | [Vite](https://vite.dev/) |

## Project Structure

```
src/                        # React frontend
  components/               # UI components
    Editor.tsx              # CodeMirror editor
    Sidebar.tsx             # Calendar + search panel
    EntryHeader.tsx         # Date display + actions
    OnThisDay.tsx           # Past entries panel
    EmptyState.tsx          # Empty state prompt
    SettingsDialog.tsx      # Storage location settings
  stores/diaryStore.ts      # Zustand state management
  hooks/useKeyboardShortcuts.ts
  lib/tauri.ts              # Tauri command wrappers
src-tauri/                  # Rust backend
  src/lib.rs                # Tauri commands (file I/O, search, location)
  src/main.rs               # Entry point
  tauri.conf.json           # Tauri configuration
```

---

This repository was fully created by [Claude Code](https://claude.ai/claude-code).

## License

MIT
