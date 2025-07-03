import { WebsocketProvider } from "y-websocket";
import * as Y from "yjs";

function getWebSocketURL(): string {
  const wsUrl = process.env.NEXT_PUBLIC_WS_URL;

  if (
    typeof window !== "undefined" &&
    window.location.protocol === "https:" &&
    wsUrl?.startsWith("ws:")
  ) {
    console.error(
      "Cannot use insecure WebSocket (ws://) from secure page (https://). Please configure WSS."
    );
    throw new Error(
      "WebSocket SSL configuration required. Please set up wss:// endpoint."
    );
  }

  return wsUrl!;
}

const persistedDocs = new Map<string, Y.Doc>();
const initializingDocs = new Set<string>();
const persistedProviders = new Map<string, any>();

function getOrCreateYDoc(documentId: string): Y.Doc {
  let doc = persistedDocs.get(documentId);
  if (!doc) {
    doc = new Y.Doc();
    persistedDocs.set(documentId, doc);
  }
  return doc;
}

async function loadPersistedState(doc: Y.Doc, documentId: string) {
  try {
    const response = await fetch(`/api/documents/${documentId}/yjs`);

    if (response.ok) {
      const yjsStateBuffer = await response.arrayBuffer();

      if (yjsStateBuffer.byteLength > 0) {
        const uint8Array = new Uint8Array(yjsStateBuffer);
        Y.applyUpdate(doc, uint8Array);
        initializingDocs.delete(documentId);
      }
    } else {
      console.warn(
        `Failed to load Yjs state for ${documentId}:`,
        response.status
      );
    }
  } catch (error) {
    console.error(`Error loading Yjs state for ${documentId}:`, error);
  }
}

export async function createPersistedWebsocketProvider(documentId: string) {
  const wsUrl = getWebSocketURL();

  if (!wsUrl) {
    throw new Error(
      "WebSocket URL is not configured. Please set NEXT_PUBLIC_WS_URL environment variable."
    );
  }

  const existingProvider = persistedProviders.get(documentId);
  if (existingProvider) {
    return existingProvider;
  }

  if (initializingDocs.has(documentId)) {
    while (initializingDocs.has(documentId)) {
      await new Promise(resolve => setTimeout(resolve, 50));
    }

    const completedProvider = persistedProviders.get(documentId);
    if (completedProvider) {
      return completedProvider;
    }
  }

  const doc = getOrCreateYDoc(documentId);

  initializingDocs.add(documentId);

  (doc as any)._pendingStateLoad = () => loadPersistedState(doc, documentId);
  (doc as any)._needsStateLoad = true;

  if (!doc) {
    throw new Error(`Failed to create or retrieve Y.Doc for ${documentId}`);
  }

  const provider = new WebsocketProvider(wsUrl, documentId, doc, {
    connect: true,
  });

  persistedProviders.set(documentId, provider);

  let saveTimeout: NodeJS.Timeout | null = null;
  const saveState = async () => {
    try {
      const state = Y.encodeStateAsUpdate(doc);

      const response = await fetch(`/api/documents/${documentId}/yjs`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/octet-stream",
          "Content-Length": state.length.toString(),
        },
        body: state,
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(
          `Failed to persist Yjs state for ${documentId}:`,
          response.status,
          errorText
        );
      }
    } catch (error) {
      console.error(`Error persisting Yjs state for ${documentId}:`, error);
    }
  };

  doc.on("update", (update: Uint8Array, origin: any) => {
    if (saveTimeout) {
      clearTimeout(saveTimeout);
    }
    saveTimeout = setTimeout(() => {
      saveState();
    }, 2000);
  });

  const handleBeforeUnload = () => {
    if (saveTimeout) {
      clearTimeout(saveTimeout);
    }
    try {
      const state = Y.encodeStateAsUpdate(doc);
      const blob = new Blob([state], {
        type: "application/octet-stream",
      });

      navigator.sendBeacon(`/api/documents/${documentId}/yjs`, blob);
    } catch (error) {
      console.error("Error saving on beforeunload:", error);
    }
  };

  if (typeof window !== "undefined") {
    window.addEventListener("beforeunload", handleBeforeUnload);
  }

  if (!provider.doc) {
    throw new Error("Failed to create provider with valid Y.Doc");
  }

  provider.on("connection-error", (error: any) => {
    console.error(`Yjs connection error for ${documentId}:`, error);
  });

  const originalDestroy = provider.destroy.bind(provider);
  provider.destroy = () => {
    if (saveTimeout) {
      clearTimeout(saveTimeout);
    }

    if (typeof window !== "undefined") {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    }

    saveState();

    persistedProviders.delete(documentId);
    initializingDocs.delete(documentId);

    originalDestroy();
  };

  return provider;
}

export function clearPersistedDoc(documentId: string) {
  const provider = persistedProviders.get(documentId);
  if (provider) {
    provider.destroy();
  }

  persistedDocs.delete(documentId);
  persistedProviders.delete(documentId);
  initializingDocs.delete(documentId);
}

export function createWebsocketProvider(documentId: string) {
  return createPersistedWebsocketProvider(documentId);
}
