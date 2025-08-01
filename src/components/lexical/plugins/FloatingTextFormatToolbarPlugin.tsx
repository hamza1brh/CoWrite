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
  $setSelection,
  RangeSelection,
} from "lexical";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { mergeRegister } from "@lexical/utils";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Sparkles, X } from "lucide-react";

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
  anchorElem: HTMLElement,
  isExpanded: boolean = false
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

  // For expanded AI prompt, be more flexible with positioning
  if (isExpanded) {
    // Ensure it stays within the viewport bounds
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    // Keep within left/right bounds of viewport
    if (left < 10) {
      left = 10;
    } else if (left + floatingElemRect.width > viewportWidth - 10) {
      left = viewportWidth - floatingElemRect.width - 10;
    }

    // Keep within top/bottom bounds of viewport
    if (top < 10) {
      top = 10;
    } else if (top + floatingElemRect.height > viewportHeight - 10) {
      top = viewportHeight - floatingElemRect.height - 10;
    }
  } else {
    // Original logic for non-expanded state
    if (left < editorScrollerRect.left) {
      left = editorScrollerRect.left + 10;
    } else if (left + floatingElemRect.width > editorScrollerRect.right) {
      left = editorScrollerRect.right - floatingElemRect.width - 10;
    }
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
  onAIPromptToggle,
}: {
  editor: LexicalEditor;
  anchorElem: HTMLElement;
  isBold: boolean;
  isItalic: boolean;
  isUnderline: boolean;
  onAIPromptToggle?: (isShowing: boolean) => void;
}): React.JSX.Element {
  const popupCharStylesEditorRef = useRef<HTMLDivElement | null>(null);
  const [showAIPrompt, setShowAIPrompt] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [isProcessingAI, setIsProcessingAI] = useState(false);
  const [savedSelection, setSavedSelection] = useState<{text: string, selection: RangeSelection | null}>({text: "", selection: null});

  // Notify parent when AI prompt state changes
  useEffect(() => {
    onAIPromptToggle?.(showAIPrompt);
  }, [showAIPrompt, onAIPromptToggle]);

  const handleShowAIPrompt = () => {
    // Save the current Lexical selection before opening AI prompt
    editor.getEditorState().read(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        const text = selection.getTextContent();
        // Clone the selection to preserve it
        const clonedSelection = selection.clone();
        setSavedSelection({text, selection: clonedSelection});
      }
    });
    setShowAIPrompt(true);
  };

  const handleAIProcess = async () => {
    if (!aiPrompt.trim()) {
      toast.error("Please enter a prompt for AI processing");
      return;
    }

    if (!savedSelection.text.trim()) {
      toast.error("No text selected for AI processing");
      return;
    }

    setIsProcessingAI(true);

    try {
      const response = await fetch("/api/ai/process", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          task: "custom",
          selectedText: savedSelection.text,
          options: {
            customPrompt: aiPrompt,
            customTitle: "Custom AI Processing",
            customDescription: `AI processed with prompt: "${aiPrompt.substring(0, 50)}${aiPrompt.length > 50 ? "..." : ""}"`,
            temperature: 0.3,
            maxTokens: 600,
          },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const data = await response.json();

      if (data.success && data.result) {
        // Restore the saved selection and replace with AI result
        editor.update(() => {
          if (savedSelection.selection) {
            // Restore the saved Lexical selection
            $setSelection(savedSelection.selection);
            const currentSelection = $getSelection();
            if ($isRangeSelection(currentSelection)) {
              currentSelection.insertText(data.result.suggestedText);
            }
          }
        });

        toast.success("AI processing completed successfully");
        setShowAIPrompt(false);
        setAiPrompt("");
        setSavedSelection({text: "", selection: null});
      } else {
        throw new Error("Invalid response format");
      }
    } catch (error) {
      console.error("AI processing error:", error);
      toast.error(
        error instanceof Error
          ? `AI processing failed: ${error.message}`
          : "Failed to process AI request"
      );
    } finally {
      setIsProcessingAI(false);
    }
  };

  const handleCancelAI = () => {
    setShowAIPrompt(false);
    setAiPrompt("");
    setSavedSelection({text: "", selection: null});
  };

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
      setFloatingElemPosition(
        rangeRect,
        popupCharStylesEditorElem,
        anchorElem,
        showAIPrompt
      );
    } else {
      // Only hide toolbar when no valid selection AND AI prompt is not showing
      if (!showAIPrompt) {
        popupCharStylesEditorElem.style.opacity = "0";
        popupCharStylesEditorElem.style.transform =
          "translate(-10000px, -10000px)";
      }
    }
  }, [editor, anchorElem, showAIPrompt]);

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

  // Reposition toolbar when AI prompt state changes
  useEffect(() => {
    if (showAIPrompt) {
      // Small delay to allow the DOM to update with new dimensions
      setTimeout(() => {
        editor.getEditorState().read(() => {
          $updateTextFormatFloatingToolbar();
        });
      }, 10);
    }
  }, [showAIPrompt, editor, $updateTextFormatFloatingToolbar]);

  return (
    <div
      ref={popupCharStylesEditorRef}
      className={`fixed top-0 left-0 z-[1000] opacity-0 bg-popover border border-border rounded-md shadow-md transition-all duration-200 ${
        showAIPrompt ? "p-3 min-w-80" : "p-1 flex items-center"
      }`}
    >
      {!showAIPrompt ? (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            className={`h-8 w-8 p-0 ${isBold ? "bg-accent text-accent-foreground" : ""}`}
            onClick={() => {
              editor.dispatchCommand(FORMAT_TEXT_COMMAND, "bold");
            }}
            aria-label="Format text as bold"
          >
            <span className="font-bold text-sm">B</span>
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            className={`h-8 w-8 p-0 ${isItalic ? "bg-accent text-accent-foreground" : ""}`}
            onClick={() => {
              editor.dispatchCommand(FORMAT_TEXT_COMMAND, "italic");
            }}
            aria-label="Format text as italics"
          >
            <span className="italic text-sm">I</span>
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            className={`h-8 w-8 p-0 ${isUnderline ? "bg-accent text-accent-foreground" : ""}`}
            onClick={() => {
              editor.dispatchCommand(FORMAT_TEXT_COMMAND, "underline");
            }}
            aria-label="Format text to underlined"
          >
            <span className="underline text-sm">U</span>
          </Button>
          
          <div className="w-px h-4 bg-border mx-1" />
          
          <Button
            variant="ghost"
            size="sm"
            className="h-8 px-2 text-xs font-medium gap-1"
            onClick={handleShowAIPrompt}
            aria-label="AI Process Selected Text"
          >
            <Sparkles className="h-3 w-3" />
            AI
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-foreground">AI Assistant</h4>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={handleCancelAI}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
          
          {savedSelection.text && (
            <div className="text-xs text-muted-foreground bg-muted/50 p-2 rounded border">
              <div className="font-medium mb-1">Selected text:</div>
              <div className="italic">&ldquo;{savedSelection.text.length > 100 ? savedSelection.text.substring(0, 100) + "..." : savedSelection.text}&rdquo;</div>
            </div>
          )}
          
          <Textarea
            value={aiPrompt}
            onChange={e => setAiPrompt(e.target.value)}
            placeholder="e.g., Make this more professional, Translate to Spanish, Add more details..."
            className="min-h-16 text-xs resize-none"
            onKeyDown={e => {
              if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
                handleAIProcess();
              }
              if (e.key === "Escape") {
                handleCancelAI();
              }
            }}
            autoFocus
          />
          
          <div className="flex gap-2 justify-end">
            <Button
              variant="outline"
              size="sm"
              className="h-7 px-3 text-xs"
              onClick={handleCancelAI}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              className="h-7 px-3 text-xs"
              onClick={handleAIProcess}
              disabled={isProcessingAI || !aiPrompt.trim()}
            >
              {isProcessingAI ? "Processing..." : "Apply"}
            </Button>
          </div>
        </div>
      )}
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
  const [aiPromptActive, setAiPromptActive] = useState(false);

  const handleAIPromptToggle = useCallback((isShowing: boolean) => {
    setAiPromptActive(isShowing);
  }, []);

  const updatePopup = useCallback(() => {
    editor.getEditorState().read(() => {
      // Should not to pop up the floating toolbar when using IME input
      if (editor.isComposing()) {
        return;
      }

      const selection = $getSelection();
      const nativeSelection = window.getSelection();
      const rootElement = editor.getRootElement();

      // Check if we have a valid selection or if AI prompt is active
      if (
        (!$isRangeSelection(selection) ||
          selection.isCollapsed() || // Don't show for collapsed selections
          !nativeSelection ||
          nativeSelection.isCollapsed ||
          !rootElement ||
          !rootElement.contains(nativeSelection.anchorNode)) &&
        !aiPromptActive
      ) {
        setIsText(false);
        return;
      }

      if ($isRangeSelection(selection)) {
        const node = getSelectedNode(selection);
        const textContent = selection.getTextContent();

        // Update text format states
        setIsBold(selection.hasFormat("bold"));
        setIsItalic(selection.hasFormat("italic"));
        setIsUnderline(selection.hasFormat("underline"));

        // Show toolbar if there's actual text content selected or AI prompt is active
        if (textContent.trim() !== "" || aiPromptActive) {
          setIsText(true);
        } else {
          setIsText(false);
        }
      } else if (aiPromptActive) {
        setIsText(true);
      }
    });
  }, [editor, aiPromptActive]);

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
      onAIPromptToggle={handleAIPromptToggle}
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
