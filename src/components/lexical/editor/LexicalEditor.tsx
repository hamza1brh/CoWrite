"use client";

import { $getRoot, $createParagraphNode, $createTextNode } from "lexical";
import { useEffect, useCallback, useState } from "react";
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { AutoFocusPlugin } from "@lexical/react/LexicalAutoFocusPlugin";
import { LinkPlugin } from "@lexical/react/LexicalLinkPlugin";
import { ListPlugin } from "@lexical/react/LexicalListPlugin";
import { MarkdownShortcutPlugin } from "@lexical/react/LexicalMarkdownShortcutPlugin";
import { TRANSFORMERS } from "@lexical/markdown";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";
import { $getSelection, $isRangeSelection, FORMAT_TEXT_COMMAND } from "lexical";
import { $setBlocksType } from "@lexical/selection";
import {
  INSERT_UNORDERED_LIST_COMMAND,
  INSERT_ORDERED_LIST_COMMAND,
} from "@lexical/list";

// Import nodes
import { HeadingNode, QuoteNode, $createHeadingNode } from "@lexical/rich-text";
import { TableCellNode, TableNode, TableRowNode } from "@lexical/table";
import {
  ListItemNode,
  ListNode,
  $createListNode,
  $createListItemNode,
} from "@lexical/list";
import { CodeHighlightNode, CodeNode } from "@lexical/code";
import { AutoLinkNode, LinkNode } from "@lexical/link";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Bold, Italic, Underline, List, ListOrdered } from "lucide-react";

const placeholder = "Start writing your document...";

const theme = {
  paragraph: "mb-4 text-gray-900 dark:text-gray-100 leading-relaxed",
  heading: {
    h1: "text-4xl font-bold mb-6 mt-8 text-gray-900 dark:text-gray-100 leading-tight",
    h2: "text-3xl font-semibold mb-4 mt-6 text-gray-900 dark:text-gray-100 leading-tight",
    h3: "text-2xl font-medium mb-3 mt-5 text-gray-900 dark:text-gray-100 leading-tight",
  },
  list: {
    nested: {
      listitem: "list-none",
    },
    ol: "list-decimal ml-6 mb-4 space-y-2",
    ul: "list-disc ml-6 mb-4 space-y-2",
    listitem: "leading-relaxed text-gray-900 dark:text-gray-100",
  },
  text: {
    bold: "font-bold",
    italic: "italic",
    underline: "underline",
    strikethrough: "line-through",
    code: "bg-gray-100 dark:bg-gray-800 rounded px-1 py-0.5 font-mono text-sm",
  },
  code: "bg-gray-100 dark:bg-gray-800 rounded-lg p-4 font-mono text-sm mb-4",
  quote:
    "border-l-4 border-gray-300 dark:border-gray-600 pl-4 italic mb-4 text-gray-700 dark:text-gray-300",
  link: "text-blue-600 dark:text-blue-400 underline hover:no-underline",
};

const editorConfig = {
  namespace: "CollaborativeEditor",
  theme,
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
  onError: (error: Error) => {
    console.error(error);
  },
};

// Toolbar component that lives inside the LexicalComposer context
function LexicalToolbar() {
  const [editor] = useLexicalComposerContext();
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);

  const updateToolbar = useCallback(() => {
    const selection = $getSelection();
    if ($isRangeSelection(selection)) {
      setIsBold(selection.hasFormat("bold"));
      setIsItalic(selection.hasFormat("italic"));
      setIsUnderline(selection.hasFormat("underline"));
    }
  }, []);

  useEffect(() => {
    return editor.registerUpdateListener(({ editorState }) => {
      editorState.read(() => {
        updateToolbar();
      });
    });
  }, [editor, updateToolbar]);

  const formatText = (format: "bold" | "italic" | "underline") => {
    editor.dispatchCommand(FORMAT_TEXT_COMMAND, format);
  };

  const formatHeading = (headingSize: "h1" | "h2" | "h3") => {
    editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        $setBlocksType(selection, () => $createHeadingNode(headingSize));
      }
    });
  };

  const formatList = (listType: "bullet" | "number") => {
    if (listType === "bullet") {
      editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined);
    } else {
      editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined);
    }
  };

  return (
    <div className="flex items-center space-x-4">
      <div className="flex items-center space-x-2">
        <Button
          variant={isBold ? "default" : "ghost"}
          size="sm"
          onClick={() => formatText("bold")}
        >
          <Bold className="h-4 w-4" />
        </Button>
        <Button
          variant={isItalic ? "default" : "ghost"}
          size="sm"
          onClick={() => formatText("italic")}
        >
          <Italic className="h-4 w-4" />
        </Button>
        <Button
          variant={isUnderline ? "default" : "ghost"}
          size="sm"
          onClick={() => formatText("underline")}
        >
          <Underline className="h-4 w-4" />
        </Button>
      </div>

      <Separator orientation="vertical" className="h-4" />

      <div className="flex items-center space-x-2">
        <Button variant="ghost" size="sm" onClick={() => formatHeading("h1")}>
          H1
        </Button>
        <Button variant="ghost" size="sm" onClick={() => formatHeading("h2")}>
          H2
        </Button>
        <Button variant="ghost" size="sm" onClick={() => formatHeading("h3")}>
          H3
        </Button>
      </div>

      <Separator orientation="vertical" className="h-4" />

      <div className="flex items-center space-x-2">
        <Button variant="ghost" size="sm" onClick={() => formatList("bullet")}>
          <List className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="sm" onClick={() => formatList("number")}>
          <ListOrdered className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

// Plugin to set initial content
function InitialContentPlugin() {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    // Use setTimeout to ensure the editor is fully initialized
    const timer = setTimeout(() => {
      editor.update(() => {
        const root = $getRoot();

        // Better check - also check if content is just empty
        const firstChild = root.getFirstChild();
        if (
          !firstChild ||
          (firstChild && firstChild.getTextContent().trim() === "")
        ) {
          root.clear();

          // Create proper Lexical nodes
          const heading = $createHeadingNode("h1");
          heading.append($createTextNode("Product Requirements Document"));

          const overview = $createHeadingNode("h2");
          overview.append($createTextNode("Overview"));

          const overviewText = $createParagraphNode();
          overviewText.append(
            $createTextNode(
              "This document outlines the requirements for our new collaborative document editing platform. The platform will enable real-time collaboration, AI-powered suggestions, and seamless document management."
            )
          );

          const userStoriesHeading = $createHeadingNode("h2");
          userStoriesHeading.append($createTextNode("User Stories"));

          const userStoriesList = $createListNode("bullet");

          const listItem1 = $createListItemNode();
          listItem1.append(
            $createTextNode(
              "As a user, I want to create and edit documents in real-time with my team"
            )
          );

          const listItem2 = $createListItemNode();
          listItem2.append(
            $createTextNode(
              "As a user, I want to see who else is editing the document"
            )
          );

          const listItem3 = $createListItemNode();
          listItem3.append(
            $createTextNode("As a user, I want to add comments and suggestions")
          );

          const listItem4 = $createListItemNode();
          listItem4.append(
            $createTextNode(
              "As a user, I want AI assistance for writing and editing"
            )
          );

          userStoriesList.append(listItem1, listItem2, listItem3, listItem4);

          const techHeading = $createHeadingNode("h2");
          techHeading.append($createTextNode("Technical Requirements"));

          const techText = $createParagraphNode();
          techText.append(
            $createTextNode(
              "The platform should be built using modern web technologies including React, Next.js, and WebSocket for real-time collaboration. The editor should be based on Lexical for rich text editing capabilities."
            )
          );

          const metricsHeading = $createHeadingNode("h2");
          metricsHeading.append($createTextNode("Success Metrics"));

          const metricsList = $createListNode("bullet");

          const metric1 = $createListItemNode();
          metric1.append(
            $createTextNode(
              "User engagement: 80% of users return within 7 days"
            )
          );

          const metric2 = $createListItemNode();
          metric2.append(
            $createTextNode(
              "Collaboration: Average of 3+ collaborators per document"
            )
          );

          const metric3 = $createListItemNode();
          metric3.append(
            $createTextNode("Performance: Document load time under 2 seconds")
          );

          metricsList.append(metric1, metric2, metric3);

          // Append all nodes to root
          root.append(
            heading,
            overview,
            overviewText,
            userStoriesHeading,
            userStoriesList,
            techHeading,
            techText,
            metricsHeading,
            metricsList
          );
        }
      });
    }, 100); // Small delay to ensure editor is ready

    return () => clearTimeout(timer);
  }, [editor]);

  return null;
}

interface LexicalEditorProps {
  className?: string;
  showToolbar?: boolean;
}

export default function LexicalEditor({
  className,
  showToolbar = false,
}: LexicalEditorProps) {
  return (
    <LexicalComposer initialConfig={editorConfig}>
      <div className={cn("relative", className)}>
        {/* Toolbar - only show if requested */}
        {showToolbar && (
          <div className="surface-elevated mb-4 border-b border-slate-200/50 px-6 py-3 dark:border-slate-700/50">
            <LexicalToolbar />
          </div>
        )}

        {/* Editor */}
        <RichTextPlugin
          contentEditable={
            <ContentEditable
              className="editor-input prose prose-lg max-w-none dark:prose-invert focus:outline-none"
              aria-placeholder={placeholder}
              placeholder={
                /* never change the way this placeholder is set up this is only way to use it correctly */
                <div className="editor-placeholder">{placeholder}</div>
              }
            />
          }
          placeholder={null}
          ErrorBoundary={LexicalErrorBoundary}
        />
        <HistoryPlugin />
        <AutoFocusPlugin />
        <LinkPlugin />
        <ListPlugin />
        <MarkdownShortcutPlugin transformers={TRANSFORMERS} />
        <InitialContentPlugin />
      </div>
    </LexicalComposer>
  );
}


export { LexicalToolbar };
