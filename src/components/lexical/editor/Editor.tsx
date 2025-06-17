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
import { useState, useEffect } from "react";

import InitialContentPlugin from "./InitialContentPlugin";
import FloatingTextFormatToolbarPlugin from "../plugins/FloatingTextFormatToolbarPlugin";

const placeholder = "Start writing your document...";

interface EditorContentProps {
  floatingAnchorElem?: HTMLDivElement | null;
  isSmallWidthViewport?: boolean;
  onRef?: (elem: HTMLDivElement) => void;
  readOnly?: boolean;
}

export default function Editor({
  floatingAnchorElem: externalFloatingAnchorElem,
  isSmallWidthViewport: externalIsSmallWidthViewport,
  onRef: externalOnRef,
  readOnly = false,
}: EditorContentProps) {
  const isEditable = useLexicalEditable();

  // Internal state management for floating toolbar
  const [floatingAnchorElem, setFloatingAnchorElem] =
    useState<HTMLDivElement | null>(null);
  const [isSmallWidthViewport, setIsSmallWidthViewport] =
    useState<boolean>(false);

  // Use external props if provided, otherwise use internal state
  const actualFloatingAnchorElem =
    externalFloatingAnchorElem ?? floatingAnchorElem;
  const actualIsSmallWidthViewport =
    externalIsSmallWidthViewport ?? isSmallWidthViewport;

  // Handle viewport size changes
  useEffect(() => {
    const updateViewPortWidth = () => {
      const isNextSmallWidthViewport = window.matchMedia(
        "(max-width: 1025px)"
      ).matches;
      setIsSmallWidthViewport(isNextSmallWidthViewport);
    };
    updateViewPortWidth();
    window.addEventListener("resize", updateViewPortWidth);

    return () => {
      window.removeEventListener("resize", updateViewPortWidth);
    };
  }, []);

  const onRef = (floatingAnchorElem: HTMLDivElement) => {
    if (floatingAnchorElem !== null) {
      setFloatingAnchorElem(floatingAnchorElem);
    }
    if (externalOnRef) {
      externalOnRef(floatingAnchorElem);
    }
  };

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
      {/* Floating plugins - Only show when not readOnly */}
      {actualFloatingAnchorElem && !actualIsSmallWidthViewport && !readOnly && (
        <>
          <FloatingTextFormatToolbarPlugin
            anchorElem={actualFloatingAnchorElem}
          />
        </>
      )}
    </div>
  );
}
