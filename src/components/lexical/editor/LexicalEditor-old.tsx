"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { CollaborationPlugin } from "@lexical/react/LexicalCollaborationPlugin";
import { AutoFocusPlugin } from "@lexical/react/LexicalAutoFocusPlugin";
import { LinkPlugin } from "@lexical/react/LexicalLinkPlugin";
import { ListPlugin } from "@lexical/react/LexicalListPlugin";
import { MarkdownShortcutPlugin } from "@lexical/react/LexicalMarkdownShortcutPlugin";
import { TRANSFORMERS } from "@lexical/markdown";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";
import type { Provider } from "@lexical/yjs";
import * as Y from "yjs";

import InitialContentPlugin from "./InitialContentPlugin";
import LexicalToolbar from "./LexicalToolbar";
import UserControlPanel from "./UserControlPanel";

// lexical
import { HeadingNode, QuoteNode } from "@lexical/rich-text";
import { TableCellNode, TableNode, TableRowNode } from "@lexical/table";
import { ListItemNode, ListNode } from "@lexical/list";
import { CodeHighlightNode, CodeNode } from "@lexical/code";
import { AutoLinkNode, LinkNode } from "@lexical/link";
import { cn } from "@/lib/utils";

import { createWebsocketProvider } from "@/lib/providers";
import { lexicalTheme } from "@/lib/lexical-theme";
import type { UserProfile, ActiveUserProfile } from "@/lib/types/collaboration";

const placeholder = "Start writing your document...";

const editorConfig = {
  // NOTE: This is critical for collaboration plugin to set editor state to null. It
  // would indicate that the editor should not try to set any default state
  // (not even empty one), and let collaboration plugin do it instead
  editorState: null,
  namespace: "React.js Collab Demo",
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
  ],
  // Handling of errors during update
  onError(error: Error) {
    throw error;
  },

  theme: lexicalTheme,
};

interface LexicalEditorProps {
  className?: string;
  showToolbar?: boolean;
  documentId?: string;
}

export default function LexicalEditor({
  className,
  showToolbar = false,
  documentId = "lexical/react-rich-collab",
}: LexicalEditorProps) {
  const [userProfile, setUserProfile] = useState<UserProfile>(() => ({
    name: "User " + Math.floor(Math.random() * 1000),
    color: `#${Math.floor(Math.random() * 16777215).toString(16)}`,
  }));
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [yjsProvider, setYjsProvider] = useState<null | Provider>(null);
  const [connected, setConnected] = useState(false);
  const [activeUsers, setActiveUsers] = useState<ActiveUserProfile[]>([]);

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

  const handleConnectionToggle = () => {
    if (yjsProvider == null) {
      return;
    }
    if (connected) {
      yjsProvider.disconnect();
    } else {
      yjsProvider.connect();
    }
  };

  useEffect(() => {
    if (yjsProvider == null) {
      return;
    }

    yjsProvider.awareness.on("update", handleAwarenessUpdate);

    return () => yjsProvider.awareness.off("update", handleAwarenessUpdate);
  }, [yjsProvider, handleAwarenessUpdate]);

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

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <UserControlPanel
        userProfile={userProfile}
        onUserProfileChange={setUserProfile}
        connected={connected}
        activeUsers={activeUsers}
      />

      <LexicalComposer initialConfig={editorConfig}>
        <CollaborationPlugin
          id={documentId}
          providerFactory={providerFactory}
          shouldBootstrap={false}
          username={userProfile.name}
          cursorColor={userProfile.color}
          cursorsContainerRef={containerRef}
        />

        {showToolbar && (
          <div className="surface-elevated mb-4 border-b border-slate-200/50 px-6 py-3 dark:border-slate-700/50">
            <LexicalToolbar />
          </div>
        )}

        {/* Editor */}
        <div className="relative">
          <RichTextPlugin
            contentEditable={
              <ContentEditable
                className="editor-input prose prose-lg min-h-[400px] max-w-none p-6 dark:prose-invert focus:outline-none"
                aria-placeholder={placeholder}
                placeholder={
                  <div className="editor-placeholder pointer-events-none absolute left-6 top-6 text-slate-400">
                    {placeholder}
                  </div>
                }
              />
            }
            placeholder={null}
            ErrorBoundary={LexicalErrorBoundary}
          />

          <AutoFocusPlugin />
          <LinkPlugin />
          <ListPlugin />
          <MarkdownShortcutPlugin transformers={TRANSFORMERS} />
          <InitialContentPlugin />
        </div>
      </LexicalComposer>
    </div>
  );
}

export { LexicalToolbar };
