"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Sparkles, X, RefreshCw } from "lucide-react";

interface AISuggestion {
  id: string;
  type: "improvement" | "addition" | "correction" | "formatting";
  title: string;
  description: string;
  confidence: number;
  appliedAt?: string;
}

interface AIAssistantPanelProps {
  isOpen: boolean;
  onClose: () => void;
  suggestions: AISuggestion[];
  onRefreshSuggestions?: () => void;
}

export default function AIAssistantPanel({
  isOpen,
  onClose,
  suggestions,
  onRefreshSuggestions,
}: AIAssistantPanelProps) {
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
              <div className="rounded-lg bg-blue-50 p-3 dark:bg-blue-900/20">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  Im analyzing your document and can help with suggestions,
                  improvements, and content generation.
                </p>
              </div>

              <div>
                <h4 className="mb-2 font-medium">Suggestions</h4>
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
                              variant={
                                suggestion.type === "improvement"
                                  ? "default"
                                  : suggestion.type === "addition"
                                    ? "secondary"
                                    : "outline"
                              }
                              className="text-xs"
                            >
                              {suggestion.type}
                            </Badge>
                            <span className="text-xs text-slate-500">
                              {suggestion.confidence}%
                            </span>
                          </div>
                        </div>
                        <p className="text-sm text-slate-600 dark:text-slate-300">
                          {suggestion.description}
                        </p>
                        <Button
                          variant="outline"
                          size="sm"
                          className="mt-2 w-full"
                        >
                          Apply Suggestion
                        </Button>
                      </motion.div>
                    ))
                  ) : (
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      No suggestions available yet.
                    </p>
                  )}
                </div>
              </div>

              <div>
                <h4 className="mb-2 font-medium">Quick Actions</h4>
                <div className="space-y-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-start"
                  >
                    Improve writing style
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-start"
                  >
                    Generate summary
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-start"
                  >
                    Check grammar
                  </Button>
                </div>
              </div>
            </div>
          </ScrollArea>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
