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
  Edit3,
  Eye,
  Lock,
  Unlock,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useEffect, useState, useRef } from "react";


import type {
  DocumentMode,
  UserRole,
  Collaborator,
  EditorHeaderProps,
} from "@/lib/types/api";

export default function EditorHeader({
  documentTitle,
  onTitleChange,
  collaborators,
  showAI,
  showComments,
  onToggleAI,
  onToggleComments,
  unreadCommentsCount,
  mode,
  userRole,
  onModeChange,
  isDocumentOwner = false,
}: EditorHeaderProps) {
  const canEdit = userRole === "owner" || userRole === "editor";

  // Local state for immediate UI updates
  const [localTitle, setLocalTitle] = useState(documentTitle);
  const titleInputRef = useRef<HTMLInputElement>(null);

  // Update local state when prop changes
  useEffect(() => {
    setLocalTitle(documentTitle);
  }, [documentTitle]);

  const handleModeToggle = () => {
    if (mode === "viewing" && canEdit) {
      onModeChange("editing");
    } else if (mode === "editing") {
      onModeChange("viewing");
    }
  };

  const handleTitleChange = (newTitle: string) => {
    setLocalTitle(newTitle); // Immediate local update only
  };

  const handleTitleBlur = async () => {
    if (localTitle !== documentTitle) {
      try {
        console.log("💾 Saving title:", localTitle);
        await onTitleChange(localTitle); // Save when user clicks away
      } catch (error) {
        console.error("Failed to save title:", error);
        // Revert on error
        setLocalTitle(documentTitle);
      }
    }
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      titleInputRef.current?.blur();
    }
    if (e.key === "Escape") {
      setLocalTitle(documentTitle);
      titleInputRef.current?.blur();
    }
  };

  return (
    <TooltipProvider>
      <header className="glass-effect border-b border-slate-200/50 px-3 py-3 dark:border-slate-700/50 sm:px-6 sm:py-4">
        <div className="flex items-center justify-between gap-2">
          {/* Left side - Title and Mode */}
          <div className="flex min-w-0 flex-1 items-center space-x-2 sm:space-x-4">
            <SidebarTrigger className="shrink-0" />

            {/* Document Title */}
            <div className="flex min-w-0 items-center space-x-2">
              {mode === "editing" && canEdit ? (
                <Input
                  ref={titleInputRef}
                  value={localTitle}
                  onChange={e => handleTitleChange(e.target.value)}
                  onBlur={handleTitleBlur}
                  onKeyDown={handleTitleKeyDown}
                  className="w-auto min-w-[200px] max-w-[400px] border-transparent bg-transparent px-2 py-1 text-base font-semibold focus:border-slate-300 focus:bg-white focus-visible:ring-2 focus-visible:ring-blue-500 dark:focus:border-slate-600 dark:focus:bg-slate-800 sm:text-lg"
                  placeholder="Untitled Document"
                  style={{
                    width: `${Math.max(200, localTitle.length * 12 + 20)}px`,
                    fontSize: "18px",
                  }}
                />
              ) : (
                <h1 className="truncate text-base font-semibold sm:text-lg">
                  {localTitle || "Untitled Document"}
                </h1>
              )}

              {/* Mode Badge */}
              {mode === "editing" && (
                <Badge variant="default" className="shrink-0 text-xs">
                  <Edit3 className="mr-1 h-3 w-3" />
                  Editing
                </Badge>
              )}
            </div>
          </div>

          {/* Right side - Actions */}
          <div className="flex shrink-0 items-center gap-2">
            {/* Mode Toggle Button - Desktop */}
            <div className="hidden items-center space-x-2 sm:flex">
              {/* Role indicator for non-owners */}
              {!isDocumentOwner && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center text-sm text-muted-foreground">
                      {userRole === "viewer" ? (
                        <Lock className="h-4 w-4" />
                      ) : (
                        <Unlock className="h-4 w-4" />
                      )}
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>You have {userRole} access</p>
                  </TooltipContent>
                </Tooltip>
              )}

              {canEdit && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleModeToggle}
                      className="relative"
                    >
                      {mode === "editing" ? (
                        <>
                          <Eye className="mr-2 h-4 w-4" />
                          <span className="hidden lg:inline">View Mode</span>
                        </>
                      ) : (
                        <>
                          <Edit3 className="mr-2 h-4 w-4" />
                          <span className="hidden lg:inline">Edit Mode</span>
                        </>
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>
                      {mode === "editing"
                        ? "Switch to viewing mode"
                        : "Switch to editing mode"}
                    </p>
                  </TooltipContent>
                </Tooltip>
              )}
            </div>

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
                          .map((n: string) => n[0])
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

              {/* Invite button for owners and editors */}
              {(userRole === "owner" || userRole === "editor") && (
                <Button variant="outline" size="sm" className="hidden md:flex">
                  <Plus className="mr-2 h-4 w-4" />
                  Invite
                </Button>
              )}
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
                  {/* Mode Toggle - Mobile */}
                  {canEdit && (
                    <>
                      <DropdownMenuItem onClick={handleModeToggle}>
                        {mode === "editing" ? (
                          <>
                            <Eye className="mr-2 h-4 w-4" />
                            Switch to View Mode
                          </>
                        ) : (
                          <>
                            <Edit3 className="mr-2 h-4 w-4" />
                            Switch to Edit Mode
                          </>
                        )}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                    </>
                  )}

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

                  {(userRole === "owner" || userRole === "editor") && (
                    <DropdownMenuItem>
                      <Plus className="mr-2 h-4 w-4" />
                      Invite Collaborators
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <ThemeToggle />
          </div>
        </div>
      </header>
    </TooltipProvider>
  );
}

export type { DocumentMode, UserRole };
