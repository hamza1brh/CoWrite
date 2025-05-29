"use client";

import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { AutoFocusPlugin } from "@lexical/react/LexicalAutoFocusPlugin";
import { LinkPlugin } from "@lexical/react/LexicalLinkPlugin";
import { ListPlugin } from "@lexical/react/LexicalListPlugin";
import { MarkdownShortcutPlugin } from "@lexical/react/LexicalMarkdownShortcutPlugin";
import { TabIndentationPlugin } from "@lexical/react/LexicalTabIndentationPlugin";
import { CheckListPlugin } from "@lexical/react/LexicalCheckListPlugin";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { ClickableLinkPlugin } from "@lexical/react/LexicalClickableLinkPlugin";
import { HorizontalRulePlugin } from "@lexical/react/LexicalHorizontalRulePlugin";
import { TablePlugin } from "@lexical/react/LexicalTablePlugin";
import { HashtagPlugin } from "@lexical/react/LexicalHashtagPlugin";
import { TRANSFORMERS } from "@lexical/markdown";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";
import { useLexicalEditable } from "@lexical/react/useLexicalEditable";

import InitialContentPlugin from "./InitialContentPlugin";

const placeholder = "Start writing your document...";

interface EditorContentProps {
  floatingAnchorElem: HTMLDivElement | null;
  isSmallWidthViewport: boolean;
  onRef: (elem: HTMLDivElement) => void;
}

export default function Editor({
  floatingAnchorElem,
  isSmallWidthViewport,
  onRef,
}: EditorContentProps) {
  const isEditable = useLexicalEditable();

  return (
    <div className="relative">
      <RichTextPlugin
        contentEditable={
          <div className="editor-scroller">
            <div className="editor" ref={onRef}>
              <ContentEditable
                className="editor-input prose prose-lg min-h-[400px] max-w-none p-6 dark:prose-invert focus:outline-none"
                aria-placeholder={placeholder}
                placeholder={
                  <div className="editor-placeholder pointer-events-none absolute left-6 top-6 text-slate-400">
                    {placeholder}
                  </div>
                }
              />
            </div>
          </div>
        }
        placeholder={null}
        ErrorBoundary={LexicalErrorBoundary}
      />
      {/* Core Plugins */}
      <AutoFocusPlugin />
      <HashtagPlugin />
      <LinkPlugin />
      <ClickableLinkPlugin disabled={!isEditable} />
      {/* List Plugins */}
      <ListPlugin />
      <CheckListPlugin />
      {/* Table Plugins */}
      <TablePlugin hasCellMerge={true} hasCellBackgroundColor={true} />
      {/* Utility Plugins */}
      <TabIndentationPlugin />
      <HorizontalRulePlugin />
      {/* Markdown Support */}
      <MarkdownShortcutPlugin transformers={TRANSFORMERS} />
      {/* History Plugin for non-collaborative mode */}
      <HistoryPlugin />
      {/* Mock document content */}
      <InitialContentPlugin />
      {/* Future floating plugins can go here when floatingAnchorElem is ready */}
      {floatingAnchorElem && !isSmallWidthViewport && (
        <>
          {/* Add floating plugins here when you create them */}
          {/* <FloatingTextFormatToolbarPlugin anchorElem={floatingAnchorElem} /> */}
        </>
      )}
    </div>
  );
}
