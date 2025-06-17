import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
  $getSelection,
  $isRangeSelection,
  $isTextNode,
  $isParagraphNode,
  FORMAT_TEXT_COMMAND,
  SELECTION_CHANGE_COMMAND,
  COMMAND_PRIORITY_LOW,
  LexicalEditor,
} from "lexical";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { mergeRegister } from "@lexical/utils";

function getSelectedNode(selection: any) {
  const anchor = selection.anchor;
  const focus = selection.focus;
  const anchorNode = selection.anchor.getNode();
  const focusNode = selection.focus.getNode();
  if (anchorNode === focusNode) {
    return anchorNode;
  }
  const isBackward = selection.isBackward();
  if (isBackward) {
    return $isTextNode(focusNode) ? focusNode : focusNode;
  } else {
    return $isTextNode(anchorNode) ? anchorNode : anchorNode;
  }
}

function getDOMRangeRect(nativeSelection: Selection, rootElement: HTMLElement) {
  const domRange = nativeSelection.getRangeAt(0);
  return domRange.getBoundingClientRect();
}

function setFloatingElemPosition(
  targetRect: DOMRect,
  floatingElem: HTMLElement,
  anchorElem: HTMLElement
) {
  const scrollerElem = anchorElem.parentElement;

  if (targetRect === null || !scrollerElem) {
    floatingElem.style.opacity = "0";
    floatingElem.style.transform = "translate(-10000px, -10000px)";
    return;
  }

  const floatingElemRect = floatingElem.getBoundingClientRect();
  const anchorElementRect = anchorElem.getBoundingClientRect();
  const editorScrollerRect = scrollerElem.getBoundingClientRect();

  let top = targetRect.top - floatingElemRect.height - 10;
  let left =
    targetRect.left - floatingElemRect.width / 2 + targetRect.width / 2;

  // Adjust if toolbar would go above viewport
  if (top < editorScrollerRect.top) {
    top = targetRect.bottom + 10;
  }

  // Adjust if toolbar would go outside left/right bounds
  if (left < editorScrollerRect.left) {
    left = editorScrollerRect.left + 10;
  } else if (left + floatingElemRect.width > editorScrollerRect.right) {
    left = editorScrollerRect.right - floatingElemRect.width - 10;
  }

  // Convert to absolute positioning relative to document
  floatingElem.style.opacity = "1";
  floatingElem.style.transform = `translate(${left}px, ${top}px)`;
}

function TextFormatFloatingToolbar({
  editor,
  anchorElem,
  isBold,
  isItalic,
  isUnderline,
}: {
  editor: LexicalEditor;
  anchorElem: HTMLElement;
  isBold: boolean;
  isItalic: boolean;
  isUnderline: boolean;
}): React.JSX.Element {
  const popupCharStylesEditorRef = useRef<HTMLDivElement | null>(null);

  const $updateTextFormatFloatingToolbar = useCallback(() => {
    const selection = $getSelection();
    const popupCharStylesEditorElem = popupCharStylesEditorRef.current;
    const nativeSelection = window.getSelection();

    if (popupCharStylesEditorElem === null) {
      return;
    }

    const rootElement = editor.getRootElement();
    if (
      selection !== null &&
      nativeSelection !== null &&
      !nativeSelection.isCollapsed &&
      rootElement !== null &&
      rootElement.contains(nativeSelection.anchorNode)
    ) {
      const rangeRect = getDOMRangeRect(nativeSelection, rootElement);
      setFloatingElemPosition(rangeRect, popupCharStylesEditorElem, anchorElem);
    } else {
      // Hide toolbar when no valid selection
      popupCharStylesEditorElem.style.opacity = "0";
      popupCharStylesEditorElem.style.transform =
        "translate(-10000px, -10000px)";
    }
  }, [editor, anchorElem]);

  useEffect(() => {
    const scrollerElem = anchorElem.parentElement;

    const update = () => {
      editor.getEditorState().read(() => {
        $updateTextFormatFloatingToolbar();
      });
    };

    window.addEventListener("resize", update);
    if (scrollerElem) {
      scrollerElem.addEventListener("scroll", update);
    }

    return () => {
      window.removeEventListener("resize", update);
      if (scrollerElem) {
        scrollerElem.removeEventListener("scroll", update);
      }
    };
  }, [editor, $updateTextFormatFloatingToolbar, anchorElem]);

  useEffect(() => {
    editor.getEditorState().read(() => {
      $updateTextFormatFloatingToolbar();
    });

    return mergeRegister(
      editor.registerUpdateListener(({ editorState }: any) => {
        editorState.read(() => {
          $updateTextFormatFloatingToolbar();
        });
      }),
      editor.registerCommand(
        SELECTION_CHANGE_COMMAND,
        () => {
          $updateTextFormatFloatingToolbar();
          return false;
        },
        COMMAND_PRIORITY_LOW
      )
    );
  }, [editor, $updateTextFormatFloatingToolbar]);

  return (
    <div
      ref={popupCharStylesEditorRef}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        zIndex: 1000,
        opacity: 0,
        backgroundColor: "var(--bg-primary, white)",
        boxShadow: "0 2px 8px rgba(0, 0, 0, 0.15)",
        borderRadius: "8px",
        padding: "8px",
        display: "flex",
        gap: "4px",
        border: "1px solid var(--border-color, #e1e5e9)",
        pointerEvents: "auto",
      }}
    >
      <button
        type="button"
        onClick={() => {
          editor.dispatchCommand(FORMAT_TEXT_COMMAND, "bold");
        }}
        style={{
          padding: "8px",
          border: "none",
          borderRadius: "4px",
          backgroundColor: isBold
            ? "var(--accent-primary, #e3f2fd)"
            : "transparent",
          cursor: "pointer",
          fontWeight: "bold",
          color: "var(--text-primary, #000)",
          transition: "background-color 0.2s ease",
        }}
        aria-label="Format text as bold"
        onMouseEnter={e => {
          if (!isBold) {
            e.currentTarget.style.backgroundColor = "var(--bg-hover, #f5f5f5)";
          }
        }}
        onMouseLeave={e => {
          if (!isBold) {
            e.currentTarget.style.backgroundColor = "transparent";
          }
        }}
      >
        B
      </button>
      <button
        type="button"
        onClick={() => {
          editor.dispatchCommand(FORMAT_TEXT_COMMAND, "italic");
        }}
        style={{
          padding: "8px",
          border: "none",
          borderRadius: "4px",
          backgroundColor: isItalic
            ? "var(--accent-primary, #e3f2fd)"
            : "transparent",
          cursor: "pointer",
          fontStyle: "italic",
          color: "var(--text-primary, #000)",
          transition: "background-color 0.2s ease",
        }}
        aria-label="Format text as italics"
        onMouseEnter={e => {
          if (!isItalic) {
            e.currentTarget.style.backgroundColor = "var(--bg-hover, #f5f5f5)";
          }
        }}
        onMouseLeave={e => {
          if (!isItalic) {
            e.currentTarget.style.backgroundColor = "transparent";
          }
        }}
      >
        I
      </button>
      <button
        type="button"
        onClick={() => {
          editor.dispatchCommand(FORMAT_TEXT_COMMAND, "underline");
        }}
        style={{
          padding: "8px",
          border: "none",
          borderRadius: "4px",
          backgroundColor: isUnderline
            ? "var(--accent-primary, #e3f2fd)"
            : "transparent",
          cursor: "pointer",
          textDecoration: "underline",
          color: "var(--text-primary, #000)",
          transition: "background-color 0.2s ease",
        }}
        aria-label="Format text to underlined"
        onMouseEnter={e => {
          if (!isUnderline) {
            e.currentTarget.style.backgroundColor = "var(--bg-hover, #f5f5f5)";
          }
        }}
        onMouseLeave={e => {
          if (!isUnderline) {
            e.currentTarget.style.backgroundColor = "transparent";
          }
        }}
      >
        U
      </button>
    </div>
  );
}

function useFloatingTextFormatToolbar(
  editor: LexicalEditor,
  anchorElem: HTMLElement
): React.JSX.Element | null {
  const [isText, setIsText] = useState(false);
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);

  const updatePopup = useCallback(() => {
    editor.getEditorState().read(() => {
      // Should not to pop up the floating toolbar when using IME input
      if (editor.isComposing()) {
        return;
      }

      const selection = $getSelection();
      const nativeSelection = window.getSelection();
      const rootElement = editor.getRootElement();

      // Check if we have a valid selection
      if (
        !$isRangeSelection(selection) ||
        selection.isCollapsed() || // Don't show for collapsed selections
        !nativeSelection ||
        nativeSelection.isCollapsed ||
        !rootElement ||
        !rootElement.contains(nativeSelection.anchorNode)
      ) {
        setIsText(false);
        return;
      }

      const node = getSelectedNode(selection);
      const textContent = selection.getTextContent();

      // Update text format states
      setIsBold(selection.hasFormat("bold"));
      setIsItalic(selection.hasFormat("italic"));
      setIsUnderline(selection.hasFormat("underline"));

      // Show toolbar if there's actual text content selected
      if (textContent.trim() !== "") {
        setIsText(true);
      } else {
        setIsText(false);
      }
    });
  }, [editor]);

  useEffect(() => {
    document.addEventListener("selectionchange", updatePopup);
    return () => {
      document.removeEventListener("selectionchange", updatePopup);
    };
  }, [updatePopup]);

  useEffect(() => {
    return mergeRegister(
      editor.registerUpdateListener(() => {
        updatePopup();
      }),
      editor.registerRootListener(() => {
        if (editor.getRootElement() === null) {
          setIsText(false);
        }
      })
    );
  }, [editor, updatePopup]);

  if (!isText) {
    return null;
  }

  // Should render into document.body !
  return createPortal(
    <TextFormatFloatingToolbar
      editor={editor}
      anchorElem={anchorElem}
      isBold={isBold}
      isItalic={isItalic}
      isUnderline={isUnderline}
    />,
    document.body // Changed from anchorElem to document.body
  );
}

export default function FloatingTextFormatToolbarPlugin({
  anchorElem = document.body,
}: {
  anchorElem?: HTMLElement;
}): React.JSX.Element | null {
  const [editor] = useLexicalComposerContext();
  return useFloatingTextFormatToolbar(editor, anchorElem);
}
