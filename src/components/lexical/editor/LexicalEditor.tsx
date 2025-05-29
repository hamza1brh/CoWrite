"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { LexicalComposer } from "@lexical/react/LexicalComposer";
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

const editorConfig = {
  editorState: null,
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

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <UserControlPanel
        userProfile={userProfile}
        onUserProfileChange={setUserProfile}
        connected={connected}
        activeUsers={activeUsers}
      />

      <LexicalComposer initialConfig={editorConfig}>
        {/* Collaboration Plugin */}
        <CollaborationPlugin
          id={documentId}
          providerFactory={providerFactory}
          shouldBootstrap={false}
          username={userProfile.name}
          cursorColor={userProfile.color}
          cursorsContainerRef={containerRef}
        />

        {/* Toolbar */}
        {showToolbar && (
          <div className="surface-elevated mb-4 border-b border-slate-200/50 px-6 py-3 dark:border-slate-700/50">
            <LexicalToolbarRich />
          </div>
        )}

        {/* ✅ All editor content that needs Lexical context goes in this child component */}
        <Editor
          floatingAnchorElem={floatingAnchorElem}
          isSmallWidthViewport={isSmallWidthViewport}
          onRef={onRef}
        />
      </LexicalComposer>
    </div>
  );
}

export { LexicalToolbar };
