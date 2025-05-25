"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { ThemeToggle } from "@/components/theme-toggle";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Share2, MessageCircle, Sparkles, Plus } from "lucide-react";

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
    <header className="glass-effect border-b border-slate-200/50 px-6 py-4 dark:border-slate-700/50">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <SidebarTrigger />
          <Input
            value={documentTitle}
            onChange={e => onTitleChange(e.target.value)}
            className="h-auto border-none bg-transparent p-0 text-lg font-semibold focus-visible:ring-0"
          />
        </div>

        <div className="flex items-center space-x-4">
          {/* Collaborators */}
          <div className="flex items-center space-x-2">
            <div className="flex -space-x-2">
              {collaborators.slice(0, 4).map(collaborator => (
                <motion.div
                  key={collaborator.id}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="relative"
                  title={`${collaborator.name} (${collaborator.status})`}
                >
                  <Avatar className="h-8 w-8 border-2 border-white dark:border-slate-800">
                    <AvatarImage
                      src={collaborator.avatar || "/placeholder.svg"}
                      alt={collaborator.name}
                    />
                    <AvatarFallback>
                      {collaborator.name
                        .split(" ")
                        .map(n => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div
                    className={`absolute -bottom-1 -right-1 h-3 w-3 rounded-full border-2 border-white dark:border-slate-800 ${
                      collaborator.status === "online"
                        ? "bg-green-500"
                        : collaborator.status === "away"
                          ? "bg-yellow-500"
                          : "bg-gray-400"
                    }`}
                  />
                </motion.div>
              ))}
              {collaborators.length > 4 && (
                <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-slate-200 text-xs font-medium text-slate-600 dark:border-slate-800 dark:bg-slate-700 dark:text-slate-300">
                  +{collaborators.length - 4}
                </div>
              )}
            </div>
            <Button variant="outline" size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Invite
            </Button>
          </div>

          <Separator orientation="vertical" className="h-6" />

          <div className="flex items-center space-x-2">
            <Button
              variant={showAI ? "default" : "outline"}
              size="sm"
              onClick={onToggleAI}
              className="relative"
            >
              <Sparkles className="mr-2 h-4 w-4" />
              AI Assistant
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
              Comments
              {unreadCommentsCount > 0 && (
                <Badge variant="secondary" className="ml-2 text-xs">
                  {unreadCommentsCount}
                </Badge>
              )}
            </Button>

            <Button variant="outline" size="sm">
              <Share2 className="mr-2 h-4 w-4" />
              Share
            </Button>

            <ThemeToggle />
          </div>
        </div>
      </div>
    </header>
  );
}
