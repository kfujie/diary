import { useEffect, useRef } from "react";
import { EditorState } from "@codemirror/state";
import { EditorView, keymap, lineNumbers, highlightActiveLine } from "@codemirror/view";
import { markdown } from "@codemirror/lang-markdown";
import { defaultKeymap, history, historyKeymap } from "@codemirror/commands";
import { syntaxHighlighting, defaultHighlightStyle } from "@codemirror/language";
import { useDiaryStore } from "@/stores/diaryStore";
import { cn } from "@/lib/utils";

// Custom theme for a clean diary look
const diaryTheme = EditorView.theme({
  "&": {
    height: "100%",
    fontSize: "15px",
  },
  ".cm-content": {
    fontFamily: '"JetBrains Mono", "Menlo", monospace',
    padding: "1.5rem",
    caretColor: "hsl(var(--foreground))",
  },
  ".cm-line": {
    padding: "2px 0",
    lineHeight: "1.7",
  },
  ".cm-cursor": {
    borderLeftColor: "hsl(var(--foreground))",
    borderLeftWidth: "2px",
  },
  ".cm-activeLine": {
    backgroundColor: "hsl(var(--muted) / 0.3)",
  },
  ".cm-gutters": {
    backgroundColor: "transparent",
    borderRight: "none",
    color: "hsl(var(--muted-foreground))",
  },
  ".cm-activeLineGutter": {
    backgroundColor: "transparent",
  },
  "&.cm-focused .cm-selectionBackground, ::selection": {
    backgroundColor: "hsl(var(--primary) / 0.2)",
  },
  ".cm-selectionBackground": {
    backgroundColor: "hsl(var(--primary) / 0.2)",
  },
  ".cm-scroller": {
    overflow: "auto",
  },
});

interface EditorProps {
  className?: string;
}

export function Editor({ className }: EditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);

  const {
    editorContent,
    setEditorContent,
    saveEntry,
    hasUnsavedChanges,
    isLoading,
    currentEntry,
  } = useDiaryStore();

  // Auto-save timer ref
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Initialize editor
  useEffect(() => {
    if (!editorRef.current) return;

    const updateListener = EditorView.updateListener.of((update) => {
      if (update.docChanged) {
        const content = update.state.doc.toString();
        setEditorContent(content);
      }
    });

    // Save on Cmd/Ctrl+S
    const saveKeymap = keymap.of([
      {
        key: "Mod-s",
        run: () => {
          saveEntry();
          return true;
        },
      },
    ]);

    const state = EditorState.create({
      doc: editorContent,
      extensions: [
        lineNumbers(),
        highlightActiveLine(),
        history(),
        markdown(),
        syntaxHighlighting(defaultHighlightStyle),
        keymap.of([...defaultKeymap, ...historyKeymap]),
        saveKeymap,
        updateListener,
        diaryTheme,
        EditorView.lineWrapping,
      ],
    });

    const view = new EditorView({
      state,
      parent: editorRef.current,
    });

    viewRef.current = view;

    return () => {
      view.destroy();
    };
  }, []);

  // Update editor content when entry changes
  useEffect(() => {
    if (viewRef.current) {
      const currentContent = viewRef.current.state.doc.toString();
      if (currentContent !== editorContent) {
        viewRef.current.dispatch({
          changes: {
            from: 0,
            to: currentContent.length,
            insert: editorContent,
          },
        });
      }
    }
  }, [editorContent, currentEntry]);

  // Auto-save effect: debounce saves to 2s after last content change
  useEffect(() => {
    if (!hasUnsavedChanges) return;

    saveTimeoutRef.current = setTimeout(() => {
      saveEntry();
    }, 2000);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [editorContent, hasUnsavedChanges, saveEntry]);

  if (isLoading) {
    return (
      <div className={cn("flex items-center justify-center h-full", className)}>
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div
      ref={editorRef}
      className={cn(
        "h-full w-full bg-background overflow-hidden",
        className
      )}
    />
  );
}
