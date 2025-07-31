"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Sparkles, X, RefreshCw, CheckCircle, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { AISuggestion } from "@/lib/types/api";

interface AIAssistantPanelProps {
  isOpen: boolean;
  onClose: () => void;
  suggestions: AISuggestion[];
  onRefreshSuggestions?: () => void;
  selectedText?: string;
  onApplySuggestion?: (suggestion: AISuggestion) => void;
  onApplySuggestionWithAnimation?: (
    suggestion: AISuggestion,
    animationType?: "typewriter" | "instant"
  ) => void;
}

export default function AIAssistantPanel({
  isOpen,
  onClose,
  suggestions,
  onRefreshSuggestions,
  selectedText,
  onApplySuggestion,
  onApplySuggestionWithAnimation,
}: AIAssistantPanelProps) {
  const [loadingTask, setLoadingTask] = useState<string | null>(null);
  const [applyingId, setApplyingId] = useState<string | null>(null);

  const generateDummyResponse = (task: string): AISuggestion => {
    const dummyResponses = {
      grammar: {
        id: `dummy-${Date.now()}`,
        type: "correction" as const,
        title: "Grammar & Spelling Correction",
        description: "AI-corrected grammar and spelling mistakes",
        originalText: selectedText || "Original text here",
        suggestedText: selectedText
          ? selectedText
              .replace(/helllo/gi, "hello")
              .replace(/\bi ve\b/gi, "I've")
              .replace(/\balll\b/gi, "all")
              .replace(/\bthise\b/gi, "these")
              .replace(/\byou d\b/gi, "you'd")
              .replace(/\bits\b/gi, "it's")
              .replace(/\bmistaks\b/gi, "mistakes")
              .replace(/\bsentance\b/gi, "sentence")
          : "This is a corrected version of your text with proper grammar and spelling.",
        confidence: 92,
      },
      improve: {
        id: `dummy-${Date.now()}`,
        type: "improvement" as const,
        title: "Improve Writing Style",
        description: "AI-improved writing style for clarity and flow",
        originalText: selectedText || "Original text here",
        suggestedText: selectedText
          ? `Enhanced version: ${selectedText.charAt(0).toUpperCase() + selectedText.slice(1).toLowerCase()}. This revision demonstrates improved clarity, better flow, and more sophisticated vocabulary while maintaining the original meaning and intent.`
          : "This is an enhanced version of your text with improved writing style, better flow, and more engaging language.",
        confidence: 87,
      },
      summarize: {
        id: `dummy-${Date.now()}`,
        type: "summary" as const,
        title: "Text Summary",
        description: "AI-generated summary of the selected text",
        originalText: selectedText || "Original text here",
        suggestedText: selectedText
          ? `Summary: ${selectedText
              .split(" ")
              .slice(0, Math.min(10, selectedText.split(" ").length))
              .join(
                " "
              )}${selectedText.split(" ").length > 10 ? "..." : ""} - Key points extracted and condensed.`
          : "This is a concise summary highlighting the main points and key information from your selected text.",
        confidence: 85,
      },
    };

    return (
      dummyResponses[task as keyof typeof dummyResponses] ||
      dummyResponses.grammar
    );
  };

  const processAITask = async (task: string, options: any = {}) => {
    if (!selectedText || selectedText.trim().length === 0) {
      toast.error("Please select some text first");
      return;
    }

    if (selectedText.length > 5000) {
      toast.error(
        "Selected text is too long. Please select less than 5000 characters."
      );
      return;
    }

    setLoadingTask(task);

    try {
      await new Promise(resolve => setTimeout(resolve, 1500));

      const dummyResult = generateDummyResponse(task);

      if (onApplySuggestion) {
        onApplySuggestion(dummyResult);
      }
      toast.success("AI suggestion generated successfully");
    } catch (error) {
      console.error("Processing error:", error);
      toast.error("Failed to process AI request");
    } finally {
      setLoadingTask(null);
    }
  };

  const getBadgeVariant = (type: string) => {
    switch (type) {
      case "improvement":
        return "default";
      case "correction":
        return "destructive";
      case "summary":
        return "outline";
      case "custom":
        return "secondary";
      default:
        return "outline";
    }
  };
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: 320, opacity: 1 }}
          exit={{ width: 0, opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="surface-elevated flex flex-col overflow-hidden border-l border-slate-200/50 dark:border-slate-700/50"
          style={{ height: "calc(100vh - 73px)" }} // Fixed height minus header height
        >
          {/* Header - Fixed */}
          <div className="flex-shrink-0 border-b border-slate-200 p-4 dark:border-slate-700">
            <div className="flex items-center justify-between">
              <h3 className="flex items-center font-semibold">
                <Sparkles className="mr-2 h-4 w-4 text-blue-500" />
                AI Assistant
              </h3>
              <div className="flex items-center space-x-2">
                {onRefreshSuggestions && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onRefreshSuggestions}
                  >
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                )}
                <Button variant="ghost" size="sm" onClick={onClose}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Scrollable Content */}
          <ScrollArea className="flex-1">
            <div className="space-y-4 p-4">
              {/* Info Banner */}
              <div className="rounded-lg bg-blue-50 p-3 dark:bg-blue-900/20">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  {selectedText && selectedText.length > 0
                    ? `Text selected (${selectedText.length} characters). Use the tools below to enhance your content with AI.`
                    : "Select text in the editor to access AI-powered suggestions and improvements."}
                </p>
              </div>

              {/* Quick Actions */}
              <div>
                <h4 className="mb-3 font-medium">AI Tools</h4>
                <div className="space-y-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-start"
                    onClick={() => processAITask("grammar")}
                    disabled={!selectedText || loadingTask === "grammar"}
                  >
                    {loadingTask === "grammar" ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <CheckCircle className="mr-2 h-4 w-4" />
                    )}
                    Fix Grammar & Spelling
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-start"
                    onClick={() => processAITask("improve")}
                    disabled={!selectedText || loadingTask === "improve"}
                  >
                    {loadingTask === "improve" ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Sparkles className="mr-2 h-4 w-4" />
                    )}
                    Improve Writing Style
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-start"
                    onClick={() =>
                      processAITask("summarize", { maxLength: 100 })
                    }
                    disabled={!selectedText || loadingTask === "summarize"}
                  >
                    {loadingTask === "summarize" ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <RefreshCw className="mr-2 h-4 w-4" />
                    )}
                    Generate Summary
                  </Button>
                </div>
              </div>

              {/* AI Suggestions */}
              <div>
                <h4 className="mb-2 font-medium">
                  AI Suggestions ({suggestions.length})
                </h4>
                <div className="space-y-3">
                  {suggestions.length > 0 ? (
                    suggestions.map((suggestion, index) => (
                      <motion.div
                        key={suggestion.id}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="cursor-pointer rounded-lg border border-slate-200 bg-slate-50 p-3 transition-colors hover:bg-slate-100 dark:border-slate-600 dark:bg-slate-700 dark:hover:bg-slate-600"
                      >
                        <div className="mb-2 flex items-center justify-between">
                          <h5 className="text-sm font-medium">
                            {suggestion.title}
                          </h5>
                          <div className="flex items-center space-x-2">
                            <Badge
                              variant={getBadgeVariant(suggestion.type)}
                              className="text-xs"
                            >
                              {suggestion.type}
                            </Badge>
                            <span className="text-xs text-slate-500">
                              {suggestion.confidence}%
                            </span>
                          </div>
                        </div>
                        <p className="mb-2 text-sm text-slate-600 dark:text-slate-300">
                          {suggestion.description}
                        </p>

                        {/* Show preview of the suggestion */}
                        <div className="mb-3 rounded border bg-white p-2 dark:bg-slate-800">
                          <div className="mb-1 text-xs font-medium text-slate-500">
                            Original:
                          </div>
                          <div className="mb-2 text-xs text-slate-600 dark:text-slate-400">
                            {suggestion.originalText.length > 100
                              ? `${suggestion.originalText.substring(0, 100)}...`
                              : suggestion.originalText}
                          </div>
                          <div className="mb-1 text-xs font-medium text-slate-500">
                            Suggestion:
                          </div>
                          <div className="text-xs text-slate-800 dark:text-slate-200">
                            {suggestion.suggestedText.length > 100
                              ? `${suggestion.suggestedText.substring(0, 100)}...`
                              : suggestion.suggestedText}
                          </div>
                        </div>

                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full"
                          onClick={async () => {
                            if (onApplySuggestionWithAnimation) {
                              setApplyingId(suggestion.id);
                              try {
                                await onApplySuggestionWithAnimation(
                                  suggestion
                                );
                              } finally {
                                setApplyingId(null);
                              }
                            } else {
                              onApplySuggestion?.(suggestion);
                            }
                          }}
                          disabled={applyingId === suggestion.id}
                        >
                          {applyingId === suggestion.id ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Applying...
                            </>
                          ) : (
                            "Apply Suggestion"
                          )}
                        </Button>
                      </motion.div>
                    ))
                  ) : (
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      No AI suggestions yet. Select text and use the tools above
                      to get started.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </ScrollArea>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
