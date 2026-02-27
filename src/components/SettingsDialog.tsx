import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { X, FolderOpen, RotateCcw } from "lucide-react";
import { getStoragePath, setStoragePath, resetStoragePath } from "@/lib/tauri";
import { open } from "@tauri-apps/plugin-dialog";

interface SettingsDialogProps {
  open: boolean;
  onClose: () => void;
  onStoragePathChanged: () => void;
}

export function SettingsDialog({ open: isOpen, onClose, onStoragePathChanged }: SettingsDialogProps) {
  const [currentPath, setCurrentPath] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (isOpen) {
      getStoragePath().then(setCurrentPath);
    }
  }, [isOpen]);

  const handleBrowse = async () => {
    const selected = await open({
      directory: true,
      multiple: false,
      title: "Select diary storage folder",
    });

    if (selected) {
      setIsUpdating(true);
      try {
        const newPath = await setStoragePath(selected);
        setCurrentPath(newPath);
        onStoragePathChanged();
      } catch (error) {
        console.error("Failed to set storage path:", error);
      } finally {
        setIsUpdating(false);
      }
    }
  };

  const handleReset = async () => {
    setIsUpdating(true);
    try {
      const defaultPath = await resetStoragePath();
      setCurrentPath(defaultPath);
      onStoragePathChanged();
    } catch (error) {
      console.error("Failed to reset storage path:", error);
    } finally {
      setIsUpdating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Dialog */}
      <div className="relative bg-background border rounded-lg shadow-lg w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-base font-semibold">Settings</h3>
          <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Storage Location</label>
            <p className="text-xs text-muted-foreground">
              Choose where diary entries are stored on your computer.
            </p>
            <div className="flex items-center gap-2 p-2.5 rounded-md border bg-muted/50 text-sm">
              <FolderOpen className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <span className="truncate text-muted-foreground" title={currentPath}>
                {currentPath}
              </span>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleBrowse}
                disabled={isUpdating}
                className="flex-1"
              >
                <FolderOpen className="h-4 w-4 mr-2" />
                Browse...
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleReset}
                disabled={isUpdating}
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Reset to Default
              </Button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t">
          <Button variant="default" size="sm" onClick={onClose} className="w-full">
            Done
          </Button>
        </div>
      </div>
    </div>
  );
}
