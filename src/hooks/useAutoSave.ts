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
  intervalMs = 30000, // 30 seconds periodic save
  enabled = true,
}: UseAutoSaveOptions) {
  const lastSavedDataRef = useRef<string>("");
  const currentDataRef = useRef<string>("");
  const isSavingRef = useRef(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Debounced save function
  const debouncedSave = useCallback(() => {
    const actualSave = async (data: any) => {
      if (!enabled || isSavingRef.current) return;

      const dataStr = JSON.stringify(data);
      if (dataStr === lastSavedDataRef.current) return;

      try {
        isSavingRef.current = true;
        console.log("🔄 Auto-saving document...");

        await saveFunction(data);

        lastSavedDataRef.current = dataStr;
        console.log("✅ Document auto-saved");
      } catch (error) {
        console.error("❌ Auto-save failed:", error);
        throw error;
      } finally {
        isSavingRef.current = false;
      }
    };

    return debounce(actualSave, debounceMs);
  }, [saveFunction, debounceMs, enabled]);

  // Create the debounced function
  const debouncedSaveFunction = debouncedSave();

  // Periodic save function
  const periodicSave = useCallback(async () => {
    if (!enabled || isSavingRef.current) return;

    const currentData = currentDataRef.current;
    if (!currentData || currentData === lastSavedDataRef.current) return;

    try {
      isSavingRef.current = true;
      console.log("⏰ Periodic save triggered...");

      await saveFunction(JSON.parse(currentData));

      lastSavedDataRef.current = currentData;
      console.log("✅ Periodic save completed");
    } catch (error) {
      console.error("❌ Periodic save failed:", error);
    } finally {
      isSavingRef.current = false;
    }
  }, [saveFunction, enabled]);

  // Set up periodic save interval
  useEffect(() => {
    if (!enabled) return;

    intervalRef.current = setInterval(periodicSave, intervalMs);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [periodicSave, intervalMs, enabled]);

  // Save function to be called when data changes
  const save = useCallback(
    (data: any) => {
      if (!enabled) return;

      currentDataRef.current = JSON.stringify(data);
      debouncedSaveFunction(data);
    },
    [debouncedSaveFunction, enabled]
  );

  // Update the simpler useAutoSave hook
  const performSave = useCallback(
    async (data: any) => {
      if (!enabled || isSavingRef.current) return;

      // ✅ Use a more reliable comparison method
      const dataStr = typeof data === "string" ? data : JSON.stringify(data);

      // ✅ Skip if no actual change
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

  // Force save function (useful for critical moments)
  const forceSave = useCallback(async () => {
    if (!enabled || !currentDataRef.current) return;

    try {
      isSavingRef.current = true;
      await saveFunction(JSON.parse(currentDataRef.current));
      lastSavedDataRef.current = currentDataRef.current;
      console.log("✅ Force save completed");
    } catch (error) {
      console.error("❌ Force save failed:", error);
      throw error;
    } finally {
      isSavingRef.current = false;
    }
  }, [saveFunction, enabled]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      debouncedSaveFunction.cancel();
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [debouncedSaveFunction]);

  return {
    save,
    forceSave,
    isSaving: isSavingRef.current,
  };
}
