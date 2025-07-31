"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { ThemeToggle } from "@/components/theme-toggle";
import { SidebarTrigger } from "@/components/ui/sidebar";
import InviteCollaboratorsDialog from "./InviteCollaboratorsDialog";
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
import { cn } from "@/lib/utils";
import { useSession } from "next-auth/react";

export type DocumentMode = "viewing" | "editing";
export type UserRole = "owner" | "editor" | "viewer";

export interface Collaborator {
  id: string;
  userId?: string;
  name: string;
  email: string;
  avatar?: string;
  status: "online" | "away" | "offline";
  role: "owner" | "editor" | "viewer";
  cursor?: {
    x: number;
    y: number;
    color: string;
  };
}

export interface EditorHeaderProps {
  documentTitle: string;
  onTitleChange: (title: string) => Promise<void>;
  collaborators: Collaborator[];
  showAI: boolean;
  showComments: boolean;
  onToggleAI: () => void;
  onToggleComments: () => void;
  unreadCommentsCount: number;
  mode: DocumentMode;
  userRole: UserRole;
  onModeChange: (mode: DocumentMode) => void;
  isDocumentOwner?: boolean;
  onAddCollaborator?: (
    email: string,
    role: "EDITOR" | "VIEWER"
  ) => Promise<void>;
  onRemoveCollaborator?: (collaboratorId: string) => Promise<void>;
  onChangeRole?: (
    collaboratorId: string,
    role: "EDITOR" | "VIEWER"
  ) => Promise<void>;
  showCollaborators?: boolean;
  onToggleCollaborators?: () => void;
  provider?: any;
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
  mode,
  userRole,
  onModeChange,
  isDocumentOwner = false,
  onAddCollaborator,
  onRemoveCollaborator,
  onChangeRole,
  showCollaborators = false,
  onToggleCollaborators,
  provider,
}: EditorHeaderProps) {
  const canEdit = userRole === "owner" || userRole === "editor";
  const { data: session } = useSession();

  const [awarenessUsers, setAwarenessUsers] = useState<any[]>([]);
  const [userProfiles, setUserProfiles] = useState<
    Record<string, { image?: string; name?: string; email?: string }>
  >({});
  const [loadingProfiles, setLoadingProfiles] = useState(false);

  // Fetch user profiles for all collaborators to get their real avatars
  useEffect(() => {
    const fetchUserProfiles = async () => {
      const userIds = collaborators
        .map(c => c.userId)
        .filter((id): id is string => Boolean(id));

      if (userIds.length === 0) return;

      setLoadingProfiles(true);
      try {
        const response = await fetch("/api/users/profiles", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ userIds }),
        });

        if (response.ok) {
          const profiles = await response.json();
          setUserProfiles(profiles);
          console.log("✅ User profiles fetched:", profiles);
        } else {
          console.error("Failed to fetch user profiles:", response.status);
        }
      } catch (error) {
        console.error("Failed to fetch user profiles:", error);
      } finally {
        setLoadingProfiles(false);
      }
    };

    fetchUserProfiles();
  }, [collaborators]);

  const onlineUserIds = new Set<string>();
  for (const [, state] of awarenessUsers) {
    const userId = state.user?.id || state.userId || state.id;
    if (userId && typeof userId === "string") {
      onlineUserIds.add(userId);
    }
  }

  // Enhanced helper function to get real avatar URL for a collaborator
  const getRealAvatarUrl = (collaborator: Collaborator) => {
    // Check if this is the current user
    const isCurrentUser = collaborator.userId === session?.user?.id;
    if (isCurrentUser && session?.user?.image) {
      return session.user.image;
    }

    // First, check fetched user profiles (most reliable)
    if (collaborator.userId && userProfiles[collaborator.userId]?.image) {
      return userProfiles[collaborator.userId].image;
    }

    // Second, check awareness users (for real-time updates)
    for (const [, state] of awarenessUsers) {
      const userId = state.user?.id || state.userId || state.id;
      if (userId === collaborator.userId) {
        // Check multiple possible avatar fields from awareness
        const avatarUrl =
          state.user?.image || state.user?.imageUrl || state.user?.avatar;
        if (avatarUrl) {
          return avatarUrl;
        }
      }
    }

    // Final fallback to the stored avatar in collaborator data
    return collaborator.avatar;
  };

  useEffect(() => {
    if (!provider) {
      return;
    }

    const updateProviderInfo = () => {
      try {
        if (provider.awareness) {
          const awarenessStates = Array.from(
            provider.awareness.getStates().entries()
          );
          setAwarenessUsers(awarenessStates);
        }
      } catch (error) {
        console.error("Error updating provider info:", error);
      }
    };

    updateProviderInfo();

    const intervalId = setInterval(updateProviderInfo, 5000);

    const onAwarenessChange = () => {
      updateProviderInfo();
    };

    if (provider.awareness) {
      provider.awareness.on("change", onAwarenessChange);
    }

    return () => {
      clearInterval(intervalId);
      if (provider.awareness) {
        provider.awareness.off("change", onAwarenessChange);
      }
    };
  }, [provider]);

  const [localTitle, setLocalTitle] = useState(documentTitle);
  const titleInputRef = useRef<HTMLInputElement>(null);

  const [showInviteModal, setShowInviteModal] = useState(false);

  useEffect(() => {
    setLocalTitle(documentTitle);
  }, [documentTitle]);

  const handleEditToggle = (pressed: boolean) => {
    if (!canEdit) return;

    if (pressed) {
      onModeChange("editing");
    } else {
      onModeChange("viewing");
    }
  };

  const handleTitleChange = (newTitle: string) => {
    setLocalTitle(newTitle);
  };

  const handleTitleBlur = async () => {
    if (localTitle !== documentTitle) {
      try {
        await onTitleChange(localTitle);
      } catch (error) {
        console.error("Failed to save title:", error);
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

  const handleInviteCollaborators = () => {
    setShowInviteModal(true);
  };

  const handleShowCollaborators = () => {
    onToggleCollaborators?.();
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
            <div className="hidden items-center space-x-3 sm:flex">
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
                <div className="flex items-center space-x-3">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => handleEditToggle(mode !== "editing")}
                        className={cn(
                          "relative inline-flex h-6 w-11 items-center rounded-full border-2 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
                          mode === "editing"
                            ? "border-blue-600 bg-blue-600"
                            : "border-gray-200 bg-gray-200 dark:border-gray-700 dark:bg-gray-700"
                        )}
                        role="switch"
                        aria-checked={mode === "editing"}
                        aria-label="Toggle edit mode"
                      >
                        <motion.span
                          className={cn(
                            "inline-block h-4 w-4 rounded-full bg-white shadow-lg ring-0 transition-transform"
                          )}
                          animate={{
                            transform:
                              mode === "editing"
                                ? "translateX(20px)"
                                : "translateX(2px)",
                          }}
                          transition={{
                            type: "spring",
                            stiffness: 500,
                            damping: 30,
                          }}
                        />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>
                        {mode === "editing"
                          ? "Turn off edit mode"
                          : "Turn on edit mode"}
                      </p>
                    </TooltipContent>
                  </Tooltip>

                  <span className="hidden text-sm font-medium text-slate-700 dark:text-slate-300 lg:inline">
                    Edit Mode
                  </span>
                </div>
              )}
            </div>

            {/* Collaborators */}
            <div className="hidden items-center space-x-2 sm:flex">
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={handleShowCollaborators}
                    className="flex -space-x-2 transition-transform hover:scale-105"
                  >
                    {collaborators.slice(0, 3).map(collaborator => {
                      const isCurrentUser =
                        collaborator.userId === session?.user?.id;
                      const realAvatarUrl = getRealAvatarUrl(collaborator);
                      return (
                        <motion.div
                          key={collaborator.id}
                          initial={{ opacity: 0, scale: 0 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="relative"
                        >
                          <Avatar
                            className={cn(
                              "h-7 w-7 border-2 sm:h-8 sm:w-8",
                              isCurrentUser
                                ? "border-blue-500 dark:border-blue-400"
                                : "border-white dark:border-slate-800"
                            )}
                          >
                            <AvatarImage
                              src={realAvatarUrl}
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
                              collaborator.userId &&
                              onlineUserIds.has(collaborator.userId)
                                ? "bg-green-500"
                                : "bg-gray-400"
                            }`}
                          />
                          {isCurrentUser && (
                            <div className="absolute -right-1 -top-1 h-3 w-3 rounded-full border border-white bg-blue-500 dark:border-slate-800">
                              <div className="h-full w-full animate-pulse rounded-full bg-blue-500" />
                            </div>
                          )}
                        </motion.div>
                      );
                    })}
                    {collaborators.length > 3 && (
                      <div className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-slate-200 text-xs font-medium text-slate-600 dark:border-slate-800 dark:bg-slate-700 dark:text-slate-300 sm:h-8 sm:w-8">
                        +{collaborators.length - 3}
                      </div>
                    )}
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>View all collaborators ({collaborators.length})</p>
                </TooltipContent>
              </Tooltip>

              {(userRole === "owner" || userRole === "editor") &&
                onAddCollaborator && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="hidden md:flex"
                    onClick={() => setShowInviteModal(true)}
                  >
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

              {/* <Button variant="outline" size="sm">
                <Share2 className="mr-2 h-4 w-4" />
                <span className="hidden xl:inline">Share</span>
              </Button> */}
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
                  {canEdit && (
                    <>
                      <DropdownMenuItem
                        onClick={() => handleEditToggle(mode !== "editing")}
                        className="flex items-center justify-between"
                      >
                        <div className="flex items-center">
                          <Edit3 className="mr-2 h-4 w-4" />
                          Edit Mode
                        </div>

                        <div
                          className={cn(
                            "relative inline-flex h-4 w-7 items-center rounded-full",
                            mode === "editing" ? "bg-blue-600" : "bg-gray-300"
                          )}
                        >
                          <motion.div
                            className="inline-block h-3 w-3 rounded-full bg-white shadow-sm"
                            animate={{
                              transform:
                                mode === "editing"
                                  ? "translateX(14px)"
                                  : "translateX(2px)",
                            }}
                            transition={{
                              type: "spring",
                              stiffness: 500,
                              damping: 30,
                            }}
                          />
                        </div>
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

                  {(userRole === "owner" || userRole === "editor") &&
                    onAddCollaborator && (
                      <DropdownMenuItem
                        onClick={() => setShowInviteModal(true)}
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Invite Collaborators
                      </DropdownMenuItem>
                    )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Current User Avatar */}
            <div className="hidden items-center sm:flex">
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center">
                    <Avatar className="h-8 w-8 ring-2 ring-blue-100 dark:ring-slate-700">
                      <AvatarImage
                        src={session?.user?.image || ""}
                        alt={session?.user?.name || "User"}
                      />
                      <AvatarFallback className="text-xs">
                        {session?.user?.name?.charAt(0)?.toUpperCase() || "U"}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{session?.user?.name || "Current User"}</p>
                  <p className="text-xs text-muted-foreground">
                    {session?.user?.email}
                  </p>
                </TooltipContent>
              </Tooltip>
            </div>

            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Quick Invite Dialog */}
      {onAddCollaborator && (
        <InviteCollaboratorsDialog
          open={showInviteModal}
          onOpenChange={setShowInviteModal}
          onAddCollaborator={onAddCollaborator}
        />
      )}
    </TooltipProvider>
  );
}
