"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sparkles, X } from "lucide-react";

interface AIAssistantPanelProps {
  isOpen: boolean;
  onClose: () => void;
  suggestions: string[];
}

export default function AIAssistantPanel({
  isOpen,
  onClose,
  suggestions,
}: AIAssistantPanelProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: 320, opacity: 1 }}
          exit={{ width: 0, opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="surface-elevated overflow-hidden border-l border-slate-200/50 dark:border-slate-700/50"
        >
          <div className="border-b border-slate-200 p-4 dark:border-slate-700">
            <div className="flex items-center justify-between">
              <h3 className="flex items-center font-semibold">
                <Sparkles className="mr-2 h-4 w-4 text-blue-500" />
                AI Assistant
              </h3>
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <ScrollArea className="h-full p-4">
            <div className="space-y-4">
              <div className="rounded-lg bg-blue-50 p-3 dark:bg-blue-900/20">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  im analyzing your document and can help with suggestions,
                  improvements, and content generation.
                </p>
              </div>

              <div>
                <h4 className="mb-2 font-medium">Suggestions</h4>
                <div className="space-y-2">
                  {suggestions.map((suggestion, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="cursor-pointer rounded bg-slate-50 p-2 transition-colors hover:bg-slate-100 dark:bg-slate-700 dark:hover:bg-slate-600"
                    >
                      <p className="text-sm">{suggestion}</p>
                    </motion.div>
                  ))}
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
