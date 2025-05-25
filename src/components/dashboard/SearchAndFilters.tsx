"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Filter, Grid3X3, List } from "lucide-react";

export type ViewMode = "grid" | "list";

interface SearchAndFiltersProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
}

export function SearchAndFilters({
  searchQuery,
  onSearchChange,
  viewMode,
  onViewModeChange,
}: SearchAndFiltersProps) {
  return (
    <motion.div
      className="mb-8 flex flex-col gap-4 sm:flex-row"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
    >
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <Input
          placeholder="Search documents..."
          value={searchQuery}
          onChange={e => onSearchChange(e.target.value)}
          className="surface-elevated focus-ring pl-10"
        />
      </div>

      <div className="flex items-center space-x-2">
        <Button
          variant="outline"
          size="sm"
          className="surface-elevated focus-ring"
        >
          <Filter className="mr-2 h-4 w-4" />
          Filter
        </Button>

        <div className="surface-elevated flex rounded-lg p-1">
          <Button
            variant={viewMode === "grid" ? "default" : "ghost"}
            size="sm"
            onClick={() => onViewModeChange("grid")}
            className="focus-ring px-3"
          >
            <Grid3X3 className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === "list" ? "default" : "ghost"}
            size="sm"
            onClick={() => onViewModeChange("list")}
            className="focus-ring px-3"
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
