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

// Add highlight overlay for selected text - visual approach that doesn't interfere with Lexical state
const highlightSelectedText = (
  selection: RangeSelection,
  editor: LexicalEditor
) => {
  // Remove any existing highlight first
  const existingHighlight = document.getElementById('ai-selection-highlight');
  if (existingHighlight) {
    existingHighlight.remove();
  }

  // Get the native selection to create visual overlay
  const nativeSelection = window.getSelection();
  if (nativeSelection && nativeSelection.rangeCount > 0) {
    const range = nativeSelection.getRangeAt(0);
    const rect = range.getBoundingClientRect();

    // Create highlight div positioned absolutely over the selected text
    const highlightDiv = document.createElement('div');
    highlightDiv.style.position = 'fixed'; // Use fixed instead of absolute for better positioning
    highlightDiv.style.left = `${rect.left + window.scrollX}px`;
    highlightDiv.style.top = `${rect.top + window.scrollY}px`;
    highlightDiv.style.width = `${rect.width}px`;
    highlightDiv.style.height = `${rect.height}px`;
    highlightDiv.style.backgroundColor = 'rgba(254, 240, 138, 0.6)'; // Yellow highlight with transparency
    highlightDiv.style.pointerEvents = 'none'; // Don't interfere with interactions
    highlightDiv.style.zIndex = '999'; // Ensure it's visible but below the toolbar
    highlightDiv.style.borderRadius = '2px'; // Subtle rounded corners
    highlightDiv.style.transition = 'opacity 0.2s ease'; // Smooth appearance
    highlightDiv.id = 'ai-selection-highlight';

    // Add dark mode support
    const isDarkMode = document.documentElement.classList.contains('dark');
    if (isDarkMode) {
      highlightDiv.style.backgroundColor = 'rgba(202, 138, 4, 0.7)'; // Darker yellow for dark mode
    }

    document.body.appendChild(highlightDiv);

    // Handle scroll events to update position
    const updatePosition = () => {
      const newRect = range.getBoundingClientRect();
      highlightDiv.style.left = `${newRect.left + window.scrollX}px`;
      highlightDiv.style.top = `${newRect.top + window.scrollY}px`;
    };

    // Listen for scroll events to keep highlight in sync
    window.addEventListener('scroll', updatePosition);
    window.addEventListener('resize', updatePosition);

    // Store cleanup function
    highlightDiv.dataset.cleanup = 'true';
  }

  return null;
};

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
  const [aiResult, setAiResult] = useState<string>("");
  const [showAIResult, setShowAIResult] = useState(false);
  const [savedSelection, setSavedSelection] = useState<{
    text: string;
    selection: RangeSelection | null;
  }>({ text: "", selection: null });

  // Notify parent when AI prompt state changes
  useEffect(() => {
    onAIPromptToggle?.(showAIPrompt || showAIResult);
  }, [showAIPrompt, showAIResult, onAIPromptToggle]);

  const handleShowAIPrompt = () => {
    // Save the current Lexical selection before opening AI prompt
    editor.getEditorState().read(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        const text = selection.getTextContent();
        // Clone the selection to preserve it
        const clonedSelection = selection.clone();
        setSavedSelection({ text, selection: clonedSelection });

        // Apply highlighting and maintain selection
        highlightSelectedText(selection, editor);
      }
    });
    setShowAIPrompt(true);
  };

  // Simple typewriter animation for applying AI suggestions
  const applyTextWithTypewriter = async (newText: string) => {
    return new Promise<void>(resolve => {
      editor.update(() => {
        if (savedSelection.selection) {
          // Restore the saved Lexical selection
          $setSelection(savedSelection.selection);
          const currentSelection = $getSelection();
          if ($isRangeSelection(currentSelection)) {
            // Clear the selection first
            currentSelection.insertText("");

            // Then type out the new text character by character
            let currentIndex = 0;
            const typeNextChar = () => {
              if (currentIndex < newText.length) {
                editor.update(() => {
                  const selection = $getSelection();
                  if ($isRangeSelection(selection)) {
                    selection.insertText(newText[currentIndex]);
                  }
                });
                currentIndex++;
                setTimeout(typeNextChar, 20); // Adjust speed here (lower = faster)
              } else {
                resolve();
              }
            };

            // Start typing
            setTimeout(typeNextChar, 100);
          } else {
            resolve();
          }
        } else {
          resolve();
        }
      });
    });
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
        // Show the result instead of immediately applying it
        setAiResult(data.result.suggestedText);
        setShowAIResult(true);
        setShowAIPrompt(false);

        toast.success("AI result ready! Review and choose to apply or reject.");
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

  const handleApplyAI = async () => {
    try {
      // Remove the visual highlight overlay
      const highlightDiv = document.getElementById('ai-selection-highlight');
      if (highlightDiv) {
        // Remove event listeners
        window.removeEventListener('scroll', () => {});
        window.removeEventListener('resize', () => {});
        highlightDiv.remove();
      }

      // Apply the AI result with typewriter animation
      await applyTextWithTypewriter(aiResult);

      toast.success("AI suggestion applied successfully");
      handleResetAI();
    } catch (error) {
      console.error("Error applying AI result:", error);
      toast.error("Failed to apply AI suggestion");
    }
  };

  const handleRejectAI = () => {
    toast.info("AI suggestion rejected");
    handleResetAI();
  };

  const handleResetAI = () => {
    // Remove the visual highlight overlay
    const highlightDiv = document.getElementById('ai-selection-highlight');
    if (highlightDiv) {
      // Remove event listeners
      window.removeEventListener('scroll', () => {});
      window.removeEventListener('resize', () => {});
      highlightDiv.remove();
    }

    setShowAIPrompt(false);
    setShowAIResult(false);
    setAiPrompt("");
    setAiResult("");
    setSavedSelection({ text: "", selection: null });
  };

  const handleCancelAI = () => {
    handleResetAI();
  };

  // Cleanup highlight on unmount
  useEffect(() => {
    return () => {
      // Remove the visual highlight overlay
      const highlightDiv = document.getElementById('ai-selection-highlight');
      if (highlightDiv) {
        // Remove event listeners
        window.removeEventListener('scroll', () => {});
        window.removeEventListener('resize', () => {});
        highlightDiv.remove();
      }
    };
  }, [editor]);

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
        showAIPrompt || showAIResult
      );
    } else {
      // Only hide toolbar when no valid selection AND AI prompt/result is not showing
      if (!showAIPrompt && !showAIResult) {
        popupCharStylesEditorElem.style.opacity = "0";
        popupCharStylesEditorElem.style.transform =
          "translate(-10000px, -10000px)";
      }
    }
  }, [editor, anchorElem, showAIPrompt, showAIResult]);

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

  // Reposition toolbar when AI prompt/result state changes
  useEffect(() => {
    if (showAIPrompt || showAIResult) {
      // Small delay to allow the DOM to update with new dimensions
      setTimeout(() => {
        editor.getEditorState().read(() => {
          $updateTextFormatFloatingToolbar();
        });
      }, 10);
    }
  }, [showAIPrompt, showAIResult, editor, $updateTextFormatFloatingToolbar]);

  return (
    <div
      ref={popupCharStylesEditorRef}
      className={`surface-elevated fixed left-0 top-0 z-[1000] opacity-0 backdrop-blur-sm transition-all duration-200 ${
        showAIPrompt || showAIResult
          ? "min-w-80 max-w-md p-3"
          : "flex items-center p-1"
      }`}
      style={{
        maxHeight: showAIPrompt || showAIResult ? "70vh" : "auto",
      }}
    >
      {!showAIPrompt && !showAIResult ? (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            className={`h-8 w-8 p-0 hover:bg-accent/50 ${isBold ? "bg-accent text-accent-foreground" : ""}`}
            onClick={() => {
              editor.dispatchCommand(FORMAT_TEXT_COMMAND, "bold");
            }}
            aria-label="Format text as bold"
          >
            <span className="text-sm font-bold">B</span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            className={`h-8 w-8 p-0 hover:bg-accent/50 ${isItalic ? "bg-accent text-accent-foreground" : ""}`}
            onClick={() => {
              editor.dispatchCommand(FORMAT_TEXT_COMMAND, "italic");
            }}
            aria-label="Format text as italics"
          >
            <span className="text-sm italic">I</span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            className={`h-8 w-8 p-0 hover:bg-accent/50 ${isUnderline ? "bg-accent text-accent-foreground" : ""}`}
            onClick={() => {
              editor.dispatchCommand(FORMAT_TEXT_COMMAND, "underline");
            }}
            aria-label="Format text to underlined"
          >
            <span className="text-sm underline">U</span>
          </Button>

          <div className="mx-1 h-4 w-px bg-border/50" />

          <Button
            variant="ghost"
            size="sm"
            className="h-8 gap-1 px-2 text-xs font-medium transition-colors hover:bg-blue-50 hover:text-blue-700 dark:hover:bg-blue-950/50 dark:hover:text-blue-300"
            onClick={handleShowAIPrompt}
            aria-label="AI Process Selected Text"
          >
            <Sparkles className="h-3 w-3" />
            AI
          </Button>
        </div>
      ) : showAIPrompt ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-blue-500" />
              <h4 className="font-sans text-sm font-medium text-foreground">
                AI Assistant
              </h4>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 hover:bg-destructive/10 hover:text-destructive"
              onClick={handleCancelAI}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>

          {savedSelection.text && (
            <div className="font-sans text-sm text-muted-foreground">
              <div className="mb-1">Selected text will be highlighted:</div>
            </div>
          )}

          <Textarea
            value={aiPrompt}
            onChange={e => setAiPrompt(e.target.value)}
            placeholder="e.g., Make this more professional, Translate to Spanish, Add more details..."
            className="min-h-16 resize-none border-border/50 bg-background/50 font-sans text-sm focus:border-blue-300 dark:focus:border-blue-700"
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

          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-8 border-border/50 px-3 font-sans text-sm hover:bg-accent/50"
              onClick={handleCancelAI}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              className="button-gradient h-8 px-3 font-sans text-sm disabled:cursor-not-allowed disabled:opacity-50"
              onClick={handleAIProcess}
              disabled={isProcessingAI || !aiPrompt.trim()}
            >
              {isProcessingAI ? "Processing..." : "Generate"}
            </Button>
          </div>
        </div>
      ) : (
        <div className="max-h-[60vh] space-y-3 overflow-y-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-green-500" />
              <h4 className="font-sans text-sm font-medium text-foreground">
                AI Result
              </h4>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 hover:bg-destructive/10 hover:text-destructive"
              onClick={handleCancelAI}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>

          <div className="space-y-2">
            <div className="font-sans text-sm text-muted-foreground">
              Original:
            </div>
            <div className="max-h-20 overflow-y-auto rounded border bg-muted/30 p-2 font-sans text-sm italic text-muted-foreground">
              &ldquo;
              {savedSelection.text.length > 200
                ? savedSelection.text.substring(0, 200) + "..."
                : savedSelection.text}
              &rdquo;
            </div>

            <div className="font-sans text-sm text-muted-foreground">
              AI Suggestion:
            </div>
            <div className="max-h-40 overflow-y-auto rounded border border-green-200 bg-green-50 p-2 font-sans text-sm dark:border-green-800/30 dark:bg-green-950/20">
              {aiResult}
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-8 border-border/50 px-3 font-sans text-sm hover:bg-destructive/10 hover:text-destructive"
              onClick={handleRejectAI}
            >
              Reject
            </Button>
            <Button
              size="sm"
              className="h-8 bg-green-600 px-3 font-sans text-sm text-white hover:bg-green-700"
              onClick={handleApplyAI}
            >
              Apply
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
