"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { ThemeToggle } from "@/components/theme-toggle";
import { SidebarTrigger } from "@/components/ui/sidebar";
import {
  Share2,
  MessageCircle,
  Sparkles,
  Plus,
  MoreHorizontal,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Collaborator {
  id: number;
  name: string;
  avatar: string;
  status: "online" | "away" | "offline";
  cursor: { x: number; y: number } | null;
  lastActive?: string;
}

interface EditorHeaderProps {
  documentTitle: string;
  onTitleChange: (title: string) => void;
  collaborators: Collaborator[];
  showAI: boolean;
  showComments: boolean;
  onToggleAI: () => void;
  onToggleComments: () => void;
  unreadCommentsCount: number;
}

export default function EditorHeader({
  documentTitle,
  onTitleChange,
  collaborators,
  showAI,
  showComments,
  onToggleAI,
  onToggleComments,
  unreadCommentsCount,
}: EditorHeaderProps) {
  return (
    <header className="glass-effect border-b border-slate-200/50 px-3 py-3 dark:border-slate-700/50 sm:px-6 sm:py-4">
      <div className="flex items-center justify-between gap-2">
        {/* Left side - Title */}
        <div className="flex min-w-0 flex-1 items-center space-x-2 sm:space-x-4">
          <SidebarTrigger className="shrink-0" />
          <Input
            value={documentTitle}
            onChange={e => onTitleChange(e.target.value)}
            className="h-auto truncate border-none bg-transparent p-0 text-base font-semibold focus-visible:ring-0 sm:text-lg"
            placeholder="Untitled Document"
          />
        </div>

        {/* Right side - Actions */}
        <div className="flex shrink-0 items-center gap-2">
          {/* Collaborators - Hide on very small screens */}
          <div className="hidden items-center space-x-2 sm:flex">
            <div className="flex -space-x-2">
              {collaborators.slice(0, 3).map(collaborator => (
                <motion.div
                  key={collaborator.id}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="relative"
                  title={`${collaborator.name} (${collaborator.status})`}
                >
                  <Avatar className="h-7 w-7 border-2 border-white dark:border-slate-800 sm:h-8 sm:w-8">
                    <AvatarImage
                      src={collaborator.avatar || "/placeholder.svg"}
                      alt={collaborator.name}
                    />
                    <AvatarFallback className="text-xs">
                      {collaborator.name
                        .split(" ")
                        .map(n => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div
                    className={`absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-white dark:border-slate-800 sm:h-3 sm:w-3 ${
                      collaborator.status === "online"
                        ? "bg-green-500"
                        : collaborator.status === "away"
                          ? "bg-yellow-500"
                          : "bg-gray-400"
                    }`}
                  />
                </motion.div>
              ))}
              {collaborators.length > 3 && (
                <div className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-slate-200 text-xs font-medium text-slate-600 dark:border-slate-800 dark:bg-slate-700 dark:text-slate-300 sm:h-8 sm:w-8">
                  +{collaborators.length - 3}
                </div>
              )}
            </div>
            <Button variant="outline" size="sm" className="hidden md:flex">
              <Plus className="mr-2 h-4 w-4" />
              Invite
            </Button>
          </div>

          {/* Desktop Actions */}
          <div className="hidden items-center space-x-2 lg:flex">
            <Separator orientation="vertical" className="h-6" />

            <Button
              variant={showAI ? "default" : "outline"}
              size="sm"
              onClick={onToggleAI}
              className="relative"
            >
              <Sparkles className="mr-2 h-4 w-4" />
              <span className="hidden xl:inline">AI Assistant</span>
              <span className="xl:hidden">AI</span>
              {showAI && (
                <motion.div
                  className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-blue-500"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{
                    repeat: Number.POSITIVE_INFINITY,
                    duration: 2,
                  }}
                />
              )}
            </Button>

            <Button
              variant={showComments ? "default" : "outline"}
              size="sm"
              onClick={onToggleComments}
              className="relative"
            >
              <MessageCircle className="mr-2 h-4 w-4" />
              <span className="hidden xl:inline">Comments</span>
              <span className="xl:hidden">Chat</span>
              {unreadCommentsCount > 0 && (
                <Badge variant="secondary" className="ml-2 text-xs">
                  {unreadCommentsCount}
                </Badge>
              )}
            </Button>

            <Button variant="outline" size="sm">
              <Share2 className="mr-2 h-4 w-4" />
              <span className="hidden xl:inline">Share</span>
            </Button>
          </div>

          {/* Mobile Actions - Dropdown */}
          <div className="lg:hidden">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={onToggleAI}>
                  <Sparkles className="mr-2 h-4 w-4" />
                  AI Assistant
                  {showAI && (
                    <div className="ml-auto h-2 w-2 rounded-full bg-blue-500" />
                  )}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onToggleComments}>
                  <MessageCircle className="mr-2 h-4 w-4" />
                  Comments
                  {unreadCommentsCount > 0 && (
                    <Badge variant="secondary" className="ml-auto text-xs">
                      {unreadCommentsCount}
                    </Badge>
                  )}
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Share2 className="mr-2 h-4 w-4" />
                  Share
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Plus className="mr-2 h-4 w-4" />
                  Invite Collaborators
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
