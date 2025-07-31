"use client";

import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import AIAssistantPanel from "@/components/documents/AiAssistantPanel";
import { toast } from "sonner";
import { AISuggestion } from "@/lib/types/api";

export default function TypewriterDemo() {
  const [isAIOpen, setIsAIOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<AISuggestion[]>([]);
  const [selectedText, setSelectedText] = useState("");
  const [editorContent, setEditorContent] = useState(
    "Hello, this is a sample text with some intentional mistaks and poor grammer. You can select any part of this text and use the AI assistant to correct, improve, or summarize it. The AI will apply changes with a smooth typewriter animation similar to ChatGPT and Claude."
  );
  const [isAnimating, setIsAnimating] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleTextSelection = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = editorContent.substring(start, end);

    if (selected.trim()) {
      setSelectedText(selected);
      toast.success(
        `Selected: "${selected.substring(0, 50)}${selected.length > 50 ? "..." : ""}"`
      );
    } else {
      setSelectedText("");
    }
  };

  const typewriterAnimation = async (
    originalText: string,
    newText: string,
    startPos: number,
    endPos: number
  ): Promise<void> => {
    if (isAnimating) return;

    setIsAnimating(true);
    const textarea = textareaRef.current;
    if (!textarea) {
      setIsAnimating(false);
      return;
    }

    // Focus the textarea
    textarea.focus();

    // First, clear the selected text character by character (deletion animation)
    const deleteDelay = 30; // milliseconds between deletions
    for (let i = endPos; i > startPos; i--) {
      await new Promise(resolve => setTimeout(resolve, deleteDelay));
      const newContent =
        editorContent.substring(0, i - 1) + editorContent.substring(i);
      setEditorContent(newContent);

      // Update cursor position
      setTimeout(() => {
        textarea.setSelectionRange(i - 1, i - 1);
      }, 0);
    }

    // Small pause between deletion and typing
    await new Promise(resolve => setTimeout(resolve, 200));

    // Then type the new text character by character
    const typeDelay = 50; // milliseconds between characters
    for (let i = 0; i <= newText.length; i++) {
      await new Promise(resolve => setTimeout(resolve, typeDelay));
      const partialNewText = newText.substring(0, i);
      const newContent =
        editorContent.substring(0, startPos) +
        partialNewText +
        editorContent.substring(endPos);

      setEditorContent(newContent);

      // Update cursor position
      const newCursorPos = startPos + i;
      setTimeout(() => {
        textarea.setSelectionRange(newCursorPos, newCursorPos);
      }, 0);
    }

    setIsAnimating(false);
    toast.success("Suggestion applied with typewriter animation!");
  };

  const handleApplySuggestionWithAnimation = async (
    suggestion: AISuggestion
  ): Promise<void> => {
    if (isAnimating) {
      toast.error("Another animation is in progress");
      return;
    }

    // Find the position of the original text in the editor
    const startPos = editorContent.indexOf(suggestion.originalText);
    if (startPos === -1) {
      toast.error("Original text not found in editor");
      return;
    }

    const endPos = startPos + suggestion.originalText.length;

    // Perform the typewriter animation
    await typewriterAnimation(
      suggestion.originalText,
      suggestion.suggestedText,
      startPos,
      endPos
    );

    // Update the suggestions to mark this one as applied
    setSuggestions(prev =>
      prev.map(s =>
        s.id === suggestion.id
          ? { ...s, appliedAt: new Date().toISOString() }
          : s
      )
    );
  };

  const handleApplySuggestion = (suggestion: AISuggestion) => {
    // Instant application without animation (fallback)
    const newContent = editorContent.replace(
      suggestion.originalText,
      suggestion.suggestedText
    );
    setEditorContent(newContent);

    setSuggestions(prev =>
      prev.map(s =>
        s.id === suggestion.id
          ? { ...s, appliedAt: new Date().toISOString() }
          : s
      )
    );

    toast.success("Suggestion applied instantly!");
  };

  const handleRefreshSuggestions = () => {
    // Clear existing suggestions
    setSuggestions([]);
    toast.success("Suggestions refreshed!");
  };

  return (
    <div className="mx-auto max-w-4xl p-6">
      <div className="mb-6">
        <h1 className="mb-2 text-2xl font-bold">
          AI Assistant with Typewriter Animation Demo
        </h1>
        <p className="text-slate-600 dark:text-slate-400">
          Select text in the editor below and use the AI assistant to see the
          typewriter animation in action.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Editor Section */}
        <div className="lg:col-span-2">
          <Card className="p-4">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold">Document Editor</h3>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsAIOpen(!isAIOpen)}
                >
                  {isAIOpen ? "Close AI" : "Open AI Assistant"}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleTextSelection}
                  disabled={!selectedText}
                >
                  Use Selection ({selectedText.length} chars)
                </Button>
              </div>
            </div>

            <textarea
              ref={textareaRef}
              value={editorContent}
              onChange={e => setEditorContent(e.target.value)}
              onSelect={handleTextSelection}
              className="h-96 w-full resize-none rounded-lg border p-4 font-mono text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-800"
              placeholder="Start typing or select text to use AI suggestions..."
              disabled={isAnimating}
            />

            {isAnimating && (
              <div className="mt-2 animate-pulse text-sm text-blue-600 dark:text-blue-400">
                ✨ Applying suggestion with typewriter animation...
              </div>
            )}
          </Card>
        </div>

        {/* AI Assistant Panel */}
        <div className="lg:col-span-1">
          <AIAssistantPanel
            isOpen={isAIOpen}
            onClose={() => setIsAIOpen(false)}
            suggestions={suggestions}
            onRefreshSuggestions={handleRefreshSuggestions}
            selectedText={selectedText}
            onApplySuggestion={handleApplySuggestion}
            onApplySuggestionWithAnimation={handleApplySuggestionWithAnimation}
          />
        </div>
      </div>

      <div className="mt-6 rounded-lg bg-slate-50 p-4 dark:bg-slate-800">
        <h4 className="mb-2 font-semibold">How to test:</h4>
        <ol className="list-inside list-decimal space-y-1 text-sm text-slate-600 dark:text-slate-400">
          <li>
            Select some text in the editor (try selecting text with
            &quot;mistaks&quot; or &quot;grammer&quot;)
          </li>
          <li>Click &quot;Open AI Assistant&quot; to open the AI panel</li>
          <li>
            Click on Grammar, Improve, or Summarize buttons in the AI panel
          </li>
          <li>
            Click &quot;Apply Suggestion&quot; to see the typewriter animation
          </li>
          <li>
            Watch as the old text is deleted and new text is typed character by
            character!
          </li>
        </ol>
      </div>
    </div>
  );
}
