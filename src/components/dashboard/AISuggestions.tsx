"use client";

import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles } from "lucide-react";

interface Suggestion {
  title: string;
  description: string;
}

interface AISuggestionsProps {
  suggestions?: Suggestion[];
}

const defaultSuggestions: Suggestion[] = [
  {
    title: "Complete your PRD",
    description:
      "Add user stories and acceptance criteria to finalize your product requirements.",
  },
  {
    title: "Review team feedback",
    description:
      "You have 5 unread comments across your documents that need attention.",
  },
];

export function AISuggestions({
  suggestions = defaultSuggestions,
}: AISuggestionsProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.4 }}
      className="mt-12"
    >
      <Card className="border-purple-200 bg-gradient-to-r from-purple-50 to-blue-50 dark:border-purple-700/50 dark:bg-slate-800/30 dark:from-purple-900/30 dark:to-blue-900/30 dark:backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center text-purple-900 dark:text-purple-100">
            <Sparkles className="mr-2 h-5 w-5" />
            AI Suggestions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-4 text-purple-700 dark:text-purple-300">
            Based on your recent activity, here are some suggestions to boost
            your productivity:
          </p>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {suggestions.map((suggestion, index) => (
              <motion.div
                key={index}
                whileHover={{ scale: 1.02 }}
                className="rounded-lg border border-purple-200 bg-white p-4 dark:border-purple-700/50 dark:bg-slate-800/50 dark:backdrop-blur-sm"
              >
                <h4 className="mb-2 font-medium text-slate-900 dark:text-white">
                  {suggestion.title}
                </h4>
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  {suggestion.description}
                </p>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
