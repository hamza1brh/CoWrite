"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { CollaborationPlugin } from "@lexical/react/LexicalCollaborationPlugin";
import type { Provider } from "@lexical/yjs";
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

interface LexicalEditorProps {
  showToolbar?: boolean;
  className?: string;
  documentId?: string;
  readOnly?: boolean;
  initialContent?: any;
  onContentChange?: (editorState: any) => void;
  userRole?: "owner" | "editor" | "viewer";
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

    console.log("🔍 EditableStateController - Updating editor state:", {
      readOnly,
      userRole,
      isEditable,
      currentEditable: editor.isEditable(),
      needsUpdate: editor.isEditable() !== isEditable,
      timestamp: new Date().toISOString(),
    });

    // ✅ Always set the editable state (even if it seems the same)
    editor.setEditable(isEditable);
    console.log("✅ Editor.setEditable() called with:", isEditable);

    // ✅ Force focus if becoming editable
    if (isEditable && !editor.isEditable()) {
      setTimeout(() => {
        if (editor.isEditable()) {
          console.log("✅ Editor is now editable and focused");
        }
      }, 100);
    }
  }, [editor, readOnly, userRole]);

  return null;
}

const DEFAULT_EDITOR_STATE = JSON.stringify({
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
}: LexicalEditorProps) {
  const [userProfile, setUserProfile] = useState<UserProfile>(() => ({
    name: "User " + Math.floor(Math.random() * 1000),
    color: `#${Math.floor(Math.random() * 16777215).toString(16)}`,
  }));

  const containerRef = useRef<HTMLDivElement | null>(null);
  const [floatingAnchorElem, setFloatingAnchorElem] =
    useState<HTMLDivElement | null>(null);
  const [yjsProvider, setYjsProvider] = useState<null | Provider>(null);
  const [connected, setConnected] = useState(false);
  const [activeUsers, setActiveUsers] = useState<ActiveUserProfile[]>([]);
  const [isSmallWidthViewport, setIsSmallWidthViewport] =
    useState<boolean>(false);
  const [isLinkEditMode, setIsLinkEditMode] = useState<boolean>(false);

  const onRef = useCallback((_floatingAnchorElem: HTMLDivElement) => {
    if (_floatingAnchorElem !== null) {
      setFloatingAnchorElem(_floatingAnchorElem);
    }
  }, []);

  const handleAwarenessUpdate = useCallback(() => {
    const awareness = yjsProvider!.awareness!;
    setActiveUsers(
      Array.from(awareness.getStates().entries()).map(
        ([userId, { color, name }]) => ({
          color,
          name,
          userId,
        })
      )
    );
  }, [yjsProvider]);

  useEffect(() => {
    if (yjsProvider == null) {
      return;
    }

    yjsProvider.awareness.on("update", handleAwarenessUpdate);
    return () => yjsProvider.awareness.off("update", handleAwarenessUpdate);
  }, [yjsProvider, handleAwarenessUpdate]);

  useEffect(() => {
    const updateViewPortWidth = () => {
      const isNextSmallWidthViewport = window.matchMedia(
        "(max-width: 1025px)"
      ).matches;

      if (isNextSmallWidthViewport !== isSmallWidthViewport) {
        setIsSmallWidthViewport(isNextSmallWidthViewport);
      }
    };

    updateViewPortWidth();
    window.addEventListener("resize", updateViewPortWidth);

    return () => {
      window.removeEventListener("resize", updateViewPortWidth);
    };
  }, [isSmallWidthViewport]);

  const providerFactory = useCallback(
    (id: string, yjsDocMap: Map<string, Y.Doc>) => {
      const provider = createWebsocketProvider(id, yjsDocMap);

      provider.on("status", event => {
        setConnected(
          event.status === "connected" ||
            ("connected" in event && event.connected === true)
        );
      });

      setTimeout(() => setYjsProvider(provider), 0);
      return provider;
    },
    []
  );

  //  Create initial editor state with proper defaults
  const createInitialEditorState = () => {
    // If we have initial content, try to use it
    if (initialContent) {
      try {
        // If it's already a string, use it
        if (typeof initialContent === "string") {
          // Validate it's valid JSON
          JSON.parse(initialContent);
          return initialContent;
        }
        // If it's an object, stringify it
        return JSON.stringify(initialContent);
      } catch (error) {
        console.warn(
          "❌ Failed to parse initial content, using default:",
          error
        );
        return DEFAULT_EDITOR_STATE;
      }
    }

    console.log("📄 No initial content provided, using default empty state");
    return DEFAULT_EDITOR_STATE;
  };

  const editorConfig = {
    editorState: createInitialEditorState(),
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
    // ✅ Set initial editable state based on role
    editable: !readOnly && (userRole === "owner" || userRole === "editor"),
  };

  // ✅ Calculate if user can actually edit
  const canEdit = !readOnly && (userRole === "owner" || userRole === "editor");

  return (
    <div
      ref={containerRef}
      className={cn("relative", !canEdit && "opacity-90", className)}
    >
      <UserControlPanel
        userProfile={userProfile}
        onUserProfileChange={setUserProfile}
        connected={connected}
        activeUsers={activeUsers}
      />

      <LexicalComposer initialConfig={editorConfig}>
        <EditableStateController readOnly={readOnly} userRole={userRole} />

        {/* Collaboration Plugin */}
        {/* <CollaborationPlugin
          id={documentId}
          providerFactory={providerFactory}
          shouldBootstrap={false}
          username={userProfile.name}
          cursorColor={userProfile.color}
          cursorsContainerRef={containerRef}
        /> */}

        {/* Toolbar - Only show when user can edit and showToolbar is true */}
        {showToolbar && canEdit && (
          <div className="surface-elevated mb-4 border-b border-slate-200/50 px-6 py-3 dark:border-slate-700/50">
            <LexicalToolbarRich />
          </div>
        )}

        {/* Permission indicator for ALL non-editable states */}
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

        {/* Editor component */}
        <Editor
          floatingAnchorElem={floatingAnchorElem}
          isSmallWidthViewport={isSmallWidthViewport}
          onRef={onRef}
          readOnly={!canEdit}
          onContentChange={onContentChange}
          hasInitialContent={!!initialContent}
        />
      </LexicalComposer>
    </div>
  );
}

export { LexicalToolbar };
