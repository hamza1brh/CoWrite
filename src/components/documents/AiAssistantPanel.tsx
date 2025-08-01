"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  Sparkles,
  X,
  RefreshCw,
  CheckCircle,
  Loader2,
  Copy,
} from "lucide-react";
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
  onRejectSuggestion?: (suggestionId: string) => void;
}

export default function AIAssistantPanel({
  isOpen,
  onClose,
  suggestions,
  onRefreshSuggestions,
  selectedText,
  onApplySuggestion,
  onApplySuggestionWithAnimation,
  onRejectSuggestion,
}: AIAssistantPanelProps) {
  const [loadingTask, setLoadingTask] = useState<string | null>(null);
  const [applyingId, setApplyingId] = useState<string | null>(null);
  const [showCustomPrompt, setShowCustomPrompt] = useState(false);
  const [customPrompt, setCustomPrompt] = useState("");

  const handleCopySuggestion = async (suggestedText: string) => {
    try {
      await navigator.clipboard.writeText(suggestedText);
      toast.success("Suggestion copied to clipboard!");
    } catch (error) {
      console.error("Failed to copy to clipboard:", error);
      toast.error("Failed to copy to clipboard");
    }
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
      console.log(`🤖 Processing AI task: ${task}`);
      console.log(`📝 Selected text: ${selectedText.substring(0, 100)}...`);

      const response = await fetch("/api/ai/process", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          task,
          selectedText,
          options: {
            temperature: options.temperature || 0.7,
            maxTokens: options.maxTokens || 1000,
            customTitle: options.customTitle,
            customDescription: options.customDescription,
            customPrompt: options.customPrompt,
          },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const data = await response.json();
      console.log("✅ AI processing successful:", data);

      if (data.success && data.result) {
        if (onApplySuggestion) {
          onApplySuggestion(data.result);
        }
        toast.success(`AI ${task} completed successfully`);
      } else {
        throw new Error("Invalid response format");
      }
    } catch (error) {
      console.error("❌ AI processing error:", error);
      toast.error(
        error instanceof Error
          ? `AI processing failed: ${error.message}`
          : "Failed to process AI request"
      );
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
                    onClick={() => processAITask("summary", { maxLength: 100 })}
                    disabled={!selectedText || loadingTask === "summary"}
                  >
                    {loadingTask === "summary" ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <RefreshCw className="mr-2 h-4 w-4" />
                    )}
                    Generate Summary
                  </Button>
                </div>
              </div>

              {/* Custom AI Processing */}
              <div>
                <h4 className="mb-3 font-medium">Custom AI Processing</h4>
                {!showCustomPrompt ? (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-start"
                    onClick={() => setShowCustomPrompt(true)}
                    disabled={!selectedText}
                  >
                    <Sparkles className="mr-2 h-4 w-4" />
                    Custom AI Task
                  </Button>
                ) : (
                  <div className="space-y-3">
                    <div>
                      <label className="mb-1 text-xs font-medium text-slate-600 dark:text-slate-400">
                        Enter your custom prompt:
                      </label>
                      <textarea
                        value={customPrompt}
                        onChange={e => setCustomPrompt(e.target.value)}
                        placeholder="e.g., Make this more professional, Translate to Spanish, Add more details..."
                        className="min-h-[60px] w-full resize-none rounded-md border border-slate-200 p-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                        rows={3}
                      />
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setShowCustomPrompt(false);
                          setCustomPrompt("");
                        }}
                        className="flex-1"
                      >
                        Cancel
                      </Button>
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => {
                          if (customPrompt.trim()) {
                            processAITask("custom", { customPrompt });
                            setShowCustomPrompt(false);
                            setCustomPrompt("");
                          }
                        }}
                        disabled={
                          !customPrompt.trim() || loadingTask === "custom"
                        }
                        className="flex-1"
                      >
                        {loadingTask === "custom" ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          <>
                            <Sparkles className="mr-2 h-4 w-4" />
                            Process
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                )}
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
                          <Badge
                            variant={getBadgeVariant(suggestion.type)}
                            className="text-xs"
                          >
                            {suggestion.type}
                          </Badge>
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

                        <div className="flex space-x-2">
                          <Button
                            variant="default"
                            size="sm"
                            className="flex-1"
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
                              <>
                                <CheckCircle className="mr-2 h-4 w-4" />
                                Accept
                              </>
                            )}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              handleCopySuggestion(suggestion.suggestedText);
                            }}
                            disabled={applyingId === suggestion.id}
                            title="Copy suggestion to clipboard"
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              onRejectSuggestion?.(suggestion.id);
                            }}
                            disabled={applyingId === suggestion.id}
                            title="Reject suggestion"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
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
