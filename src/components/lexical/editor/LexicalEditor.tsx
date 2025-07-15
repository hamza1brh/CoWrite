"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { CollaborationPlugin } from "@lexical/react/LexicalCollaborationPlugin";
import * as Y from "yjs";

import { HeadingNode, QuoteNode } from "@lexical/rich-text";
import { TableCellNode, TableNode, TableRowNode } from "@lexical/table";
import { ListItemNode, ListNode } from "@lexical/list";
import { CodeHighlightNode, CodeNode } from "@lexical/code";
import { AutoLinkNode, LinkNode } from "@lexical/link";
import { HashtagNode } from "@lexical/hashtag";
import { OverflowNode } from "@lexical/overflow";
import { HorizontalRuleNode } from "@lexical/react/LexicalHorizontalRuleNode";

import Editor from "./Editor";
import LexicalToolbar from "./LexicalToolbar";
import UserControlPanel from "./UserControlPanel";

import { cn } from "@/lib/utils";
import { createWebsocketProvider } from "@/lib/providers";
import { lexicalTheme } from "@/lib/lexical-theme";
import type { UserProfile, ActiveUserProfile } from "@/lib/types/collaboration";
import LexicalToolbarRich from "./LexicalToolbarRich";

// Plugin to load persisted state after CollaborationPlugin initializes
function StateLoaderPlugin({
  yjsDoc,
  documentId,
}: {
  yjsDoc: Y.Doc;
  documentId: string;
}) {
  useEffect(() => {
    if ((yjsDoc as any)._needsStateLoad && (yjsDoc as any)._pendingStateLoad) {
      const loadState = async () => {
        try {
          await (yjsDoc as any)._pendingStateLoad();
          delete (yjsDoc as any)._needsStateLoad;
          delete (yjsDoc as any)._pendingStateLoad;
        } catch (error) {
          console.error(
            `Error loading persisted state for ${documentId}:`,
            error
          );
        }
      };

      setTimeout(loadState, 100);
    }
  }, [yjsDoc, documentId]);

  return null;
}

interface LexicalEditorProps {
  className?: string;
  showToolbar?: boolean;
  documentId?: string;
  readOnly?: boolean;
  initialContent?: any;
  onContentChange?: (editorState: any) => void;
  userRole?: "owner" | "editor" | "viewer";
  currentUser?: {
    id: string;
    name: string;
    email: string;
    avatarUrl?: string;
  };
  collaborators?: Array<{
    user: {
      id: string;
      name: string;
      email: string;
      avatarUrl?: string;
    };
    role: string;
    isOnline: boolean;
  }>;
  onlineUsers?: Set<string>;
  onProviderReady?: (provider: any) => void;
  onConnectionStatusChange?: (connected: boolean) => void;
}

function EditableStateController({
  readOnly,
  userRole,
}: {
  readOnly: boolean;
  userRole?: "owner" | "editor" | "viewer";
}) {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    const isEditable =
      !readOnly && (userRole === "owner" || userRole === "editor");

    console.log(
      `🔧 Setting editor editable: ${isEditable} (readOnly: ${readOnly}, userRole: ${userRole})`
    );
    editor.setEditable(isEditable);
  }, [editor, readOnly, userRole]);

  return null;
}

export const DEFAULT_EDITOR_STATE = JSON.stringify({
  root: {
    children: [
      {
        children: [],
        direction: null,
        format: "",
        indent: 0,
        type: "paragraph",
        version: 1,
      },
    ],
    direction: null,
    format: "",
    indent: 0,
    type: "root",
    version: 1,
  },
});

export default function LexicalEditor({
  className,
  showToolbar = false,
  documentId = "lexical/react-rich-collab",
  readOnly = false,
  initialContent = null,
  onContentChange,
  userRole = "viewer",
  currentUser,
  collaborators = [],
  onlineUsers = new Set(),
  onProviderReady,
  onConnectionStatusChange,
}: LexicalEditorProps) {
  const [userProfile, setUserProfile] = useState<UserProfile>(() => {
    return {
      name: currentUser?.name || "Loading...",
      color: `#${Math.floor(Math.random() * 16777215).toString(16)}`,
    };
  });

  useEffect(() => {
    if (currentUser) {
      setUserProfile(prev => ({
        ...prev,
        name: currentUser.name,
      }));
    }
  }, [currentUser]);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const [floatingAnchorElem, setFloatingAnchorElem] =
    useState<HTMLDivElement | null>(null);
  const [yjsProvider, setYjsProvider] = useState<any>(null);
  const [yjsDoc, setYjsDoc] = useState<Y.Doc | null>(null);
  const [providerReady, setProviderReady] = useState(false);
  const [connected, setConnected] = useState(false);
  const [activeUsers, setActiveUsers] = useState<ActiveUserProfile[]>([]);
  const [isSmallWidthViewport, setIsSmallWidthViewport] =
    useState<boolean>(false);
  const [isLinkEditMode, setIsLinkEditMode] = useState<boolean>(false);
  const [websocketUrl, setWebsocketUrl] = useState<string>("");

  const providerInitRef = useRef<string | null>(null);
  const cleanupHandlersRef = useRef<(() => void)[]>([]);
  const isMountedRef = useRef(true);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (!documentId || providerInitRef.current === documentId) return;

    let isMounted = true;
    providerInitRef.current = documentId;

    const setupProvider = async () => {
      try {
        console.log(`🔧 Setting up provider for document: ${documentId}`);
        const provider = await createWebsocketProvider(documentId);

        if (!isMounted || !isMountedRef.current) {
          console.log(`❌ Component unmounted during setup for ${documentId}`);
          provider.destroy();
          return;
        }

        if (!provider.doc) {
          console.error("Provider created without a valid Y.Doc");
          return;
        }

        setWebsocketUrl(process.env.NEXT_PUBLIC_WS_URL || "");

        const handleStatus = (event: any) => {
          const isConnected =
            event.status === "connected" ||
            ("connected" in event && event.connected === true);
          console.log(`📡 Provider status for ${documentId}:`, event.status);
          if (isMounted && isMountedRef.current) {
            setConnected(isConnected);
            onConnectionStatusChange?.(isConnected);
          }
        };

        const handleConnectionError = (error: any) => {
          console.error(`❌ Connection error for ${documentId}:`, error);
          if (isMounted && isMountedRef.current) {
            setConnected(false);
            onConnectionStatusChange?.(false);
          }
        };

        provider.on("status", handleStatus);
        provider.on("connection-error", handleConnectionError);

        cleanupHandlersRef.current = [
          () => provider.off("status", handleStatus),
          () => provider.off("connection-error", handleConnectionError),
        ];

        if (isMounted && isMountedRef.current) {
          setYjsProvider(provider);
          setYjsDoc(provider.doc);
          setProviderReady(true);
          onProviderReady?.(provider);
          console.log(`✅ Provider ready for ${documentId}`);
        }
      } catch (error) {
        console.error(`❌ Failed to setup provider for ${documentId}:`, error);
        if (isMounted && isMountedRef.current) {
          setProviderReady(false);
        }
      }
    };

    setupProvider();

    return () => {
      console.log(`🧹 Cleaning up provider for ${documentId}`);
      isMounted = false;

      // Clean up event handlers first
      cleanupHandlersRef.current.forEach(cleanup => cleanup());
      cleanupHandlersRef.current = [];

      // Reset state
      setYjsProvider(null);
      setYjsDoc(null);
      setProviderReady(false);
      setConnected(false);

      // Clear the init ref so it can be re-initialized if needed
      if (providerInitRef.current === documentId) {
        providerInitRef.current = null;
      }
    };
  }, [documentId, onProviderReady, onConnectionStatusChange]);

  useEffect(() => {
    if (!yjsProvider?.awareness || !currentUser || !providerReady) {
      return;
    }

    let hasEnhanced = false;

    const enhanceAwareness = () => {
      if (hasEnhanced || !isMountedRef.current) return;

      const currentState = yjsProvider.awareness.getLocalState();

      const enhancedAwareness = {
        ...currentState,

        user: {
          id: String(currentUser.id),
          name: currentUser.name,
          email: currentUser.email,
          avatarUrl: currentUser.avatarUrl ?? "",
          role: userRole,
        },
        userId: String(currentUser.id),
        document: {
          canEdit: !readOnly && (userRole === "owner" || userRole === "editor"),
          lastActivity: Date.now(),
        },
      };

      Object.entries(enhancedAwareness).forEach(([key, value]) => {
        yjsProvider.awareness.setLocalStateField(key, value);
      });

      hasEnhanced = true;
      console.log(`👤 Enhanced awareness for user: ${currentUser.email}`);
    };

    // Give CollaborationPlugin time to initialize, then enhance
    const timeoutId = setTimeout(enhanceAwareness, 1000);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [yjsProvider, currentUser, userRole, readOnly, providerReady]);

  const createInitialEditorState = useCallback(() => {
    if (!initialContent) {
      return undefined;
    }
    try {
      return JSON.stringify(initialContent);
    } catch (error) {
      console.error("Failed to serialize initial content:", error);
      return undefined;
    }
  }, [initialContent]);

  const isCollaborative = Boolean(documentId);

  const editorConfig = useMemo(
    () => ({
      editorState: isCollaborative ? null : createInitialEditorState(),
      namespace: "CoWrite Collaborative Editor",
      nodes: [
        HeadingNode,
        ListNode,
        ListItemNode,
        QuoteNode,
        CodeNode,
        CodeHighlightNode,
        TableNode,
        TableCellNode,
        TableRowNode,
        AutoLinkNode,
        LinkNode,
        HashtagNode,
        OverflowNode,
        HorizontalRuleNode,
      ],
      onError(error: Error) {
        console.error("❌ Lexical Editor Error:", error);
        throw error;
      },
      theme: lexicalTheme,
      editable: !readOnly && (userRole === "owner" || userRole === "editor"),
    }),
    [createInitialEditorState, readOnly, userRole, isCollaborative]
  );

  const canEdit = !readOnly && (userRole === "owner" || userRole === "editor");

  const handleEditorRef = useCallback((elem: HTMLDivElement) => {
    setFloatingAnchorElem(elem);
  }, []);

  const providerFactory = useCallback(
    (id: string, yjsDocMap: Map<string, Y.Doc>) => {
      if (!yjsProvider || !yjsDoc) {
        console.error("❌ Provider or doc not ready in providerFactory");
        throw new Error("Provider or doc not ready");
      }

      const existingDoc = yjsDocMap.get(id);
      if (existingDoc && existingDoc !== yjsDoc) {
        console.warn(
          `⚠️ Y.Doc conflict detected! Replacing existing doc for ${id}`
        );
      }

      yjsDocMap.set(id, yjsDoc);
      console.log(`🏭 Provider factory returning provider for ${id}`);
      return yjsProvider;
    },
    [yjsProvider, yjsDoc]
  );

  // Generate a stable key to prevent unnecessary re-mounting
  const editorKey = useMemo(() => {
    return `lexical-${documentId}-${userRole}`;
  }, [documentId, userRole]);

  return (
    <div
      ref={containerRef}
      className={cn("relative", !canEdit && "opacity-90", className)}
    >
      {currentUser && (
        <UserControlPanel
          currentUser={currentUser}
          connected={connected}
          collaborators={collaborators}
          onlineUsers={onlineUsers}
          provider={yjsProvider}
          yjsDoc={yjsDoc}
          websocketUrl={websocketUrl}
        />
      )}

      <LexicalComposer key={editorKey} initialConfig={editorConfig}>
        <EditableStateController readOnly={readOnly} userRole={userRole} />

        {isCollaborative &&
          providerReady &&
          yjsProvider &&
          yjsDoc &&
          documentId && (
            <>
              <CollaborationPlugin
                key={`collab-${documentId}`}
                id={documentId}
                providerFactory={providerFactory}
                shouldBootstrap={false}
                username={currentUser?.name || userProfile.name}
                cursorColor={userProfile.color}
                cursorsContainerRef={containerRef}
                initialEditorState={null}
              />
              <StateLoaderPlugin yjsDoc={yjsDoc} documentId={documentId} />
            </>
          )}

        {showToolbar && canEdit && (
          <div className="surface-elevated mb-4 border-b border-slate-200/50 px-6 py-3 dark:border-slate-700/50">
            <LexicalToolbarRich />
          </div>
        )}

        {!canEdit && (
          <div className="mb-4 flex items-center justify-center rounded-md bg-yellow-50 px-4 py-2 text-sm text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-200">
            <svg
              className="mr-2 h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
              />
            </svg>
            {readOnly
              ? "Document is read-only"
              : userRole === "viewer"
                ? "You have view-only access to this document"
                : "No edit permissions"}
          </div>
        )}

        <Editor
          floatingAnchorElem={floatingAnchorElem}
          isSmallWidthViewport={isSmallWidthViewport}
          onRef={handleEditorRef}
          readOnly={!canEdit}
          onContentChange={onContentChange}
          hasInitialContent={!!initialContent}
          isCollaborative={isCollaborative}
        />
      </LexicalComposer>
    </div>
  );
}

export { LexicalToolbar };
