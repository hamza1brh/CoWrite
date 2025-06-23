import { useCallback, useEffect, useRef } from "react";

function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): T & { cancel: () => void } {
  let timeoutId: NodeJS.Timeout;

  const debounced = ((...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  }) as T & { cancel: () => void };

  debounced.cancel = () => clearTimeout(timeoutId);

  return debounced;
}

interface UseAutoSaveOptions {
  saveFunction: (data: any) => Promise<void>;
  debounceMs?: number;
  intervalMs?: number;
  enabled?: boolean;
}

export function useAutoSave({
  saveFunction,
  debounceMs = 2000,
  intervalMs = 30000,
  enabled = true,
}: UseAutoSaveOptions) {
  const lastSavedDataRef = useRef<string>("");
  const currentDataRef = useRef<string>("");
  const isSavingRef = useRef(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // ✅ Single performSave function
  const performSave = useCallback(
    async (data: any) => {
      if (!enabled || isSavingRef.current) return;

      const dataStr = typeof data === "string" ? data : JSON.stringify(data);

      // Skip if no actual change
      if (dataStr === lastSavedDataRef.current) {
        console.log("🚫 No changes detected, skipping save");
        return;
      }

      try {
        isSavingRef.current = true;
        console.log("🔄 Saving document changes...");

        await saveFunction(data);

        lastSavedDataRef.current = dataStr;
        console.log("✅ Document saved successfully");
      } catch (error) {
        console.error("❌ Save failed:", error);
        throw error;
      } finally {
        isSavingRef.current = false;
      }
    },
    [saveFunction, enabled]
  );

  // ✅ Debounced save function
  const save = useCallback(
    (data: any) => {
      if (!enabled) return;

      currentDataRef.current = JSON.stringify(data);

      // Clear existing timeout
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }

      // Set new timeout
      debounceTimeoutRef.current = setTimeout(() => {
        performSave(data);
      }, debounceMs);
    },
    [performSave, debounceMs, enabled]
  );

  // ✅ Periodic save
  useEffect(() => {
    if (!enabled) return;

    const periodicSave = async () => {
      if (!currentDataRef.current || isSavingRef.current) return;

      const currentData = currentDataRef.current;
      if (currentData === lastSavedDataRef.current) return;

      try {
        console.log("⏰ Periodic save triggered...");
        await performSave(JSON.parse(currentData));
        console.log("✅ Periodic save completed");
      } catch (error) {
        console.error("❌ Periodic save failed:", error);
      }
    };

    intervalRef.current = setInterval(periodicSave, intervalMs);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [performSave, intervalMs, enabled]);

  // Force save function
  const forceSave = useCallback(async () => {
    if (!enabled || !currentDataRef.current) return;

    // Clear debounce timeout
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    try {
      await performSave(JSON.parse(currentDataRef.current));
    } catch (error) {
      console.error("❌ Force save failed:", error);
      throw error;
    }
  }, [performSave, enabled]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return {
    save,
    forceSave,
    isSaving: isSavingRef.current,
  };
}
