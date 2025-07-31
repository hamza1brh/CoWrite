"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { MessageCircle, X, Send, Check } from "lucide-react";

interface Comment {
  id: string;
  content: string;
  resolved: boolean;
  createdAt: string;
  updatedAt: string;
  documentId: string;
  authorId: string;
  author: {
    id: string;
    name: string;
    firstName: string;
    lastName: string;
    email: string;
    imageUrl?: string;
  };
}

interface CommentsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  comments: Comment[];
  documentId: string;
  onAddComment?: (newComment: Comment) => void;
  onResolveComment?: (commentId: string) => void;
}

export default function CommentsPanel({
  isOpen,
  onClose,
  comments,
  documentId,
  onAddComment,
  onResolveComment,
}: CommentsPanelProps) {
  const { data: session } = useSession();
  const [newComment, setNewComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userProfiles, setUserProfiles] = useState<
    Record<string, { image?: string; name?: string; email?: string }>
  >({});
  const [loadingProfiles, setLoadingProfiles] = useState(false);

  // Fetch user profiles for all comment authors to get their real avatars
  useEffect(() => {
    const fetchUserProfiles = async () => {
      const userIds = comments
        .map(c => c.author.id)
        .filter((id, index, arr) => arr.indexOf(id) === index); // Remove duplicates

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
          console.log("✅ Comment author profiles fetched:", profiles);
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
  }, [comments]);

  // Enhanced helper function to get real avatar URL for a comment author
  const getRealAvatarUrl = (author: Comment["author"]) => {
    // Check if this is the current user commenting
    const isCurrentUser = author.id === session?.user?.id;
    if (isCurrentUser && session?.user?.image) {
      return session.user.image;
    }

    // Check fetched user profiles (most reliable)
    if (userProfiles[author.id]?.image) {
      return userProfiles[author.id].image;
    }

    // Fallback to the stored imageUrl
    return author.imageUrl;
  };

  const handleSubmitComment = async () => {
    if (!newComment.trim()) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/documents/${documentId}/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content: newComment.trim(),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to add comment");
      }

      const newCommentData = await response.json();
      console.log("✅ Comment added:", newCommentData);

      if (onAddComment) {
        onAddComment(newCommentData);
      }

      setNewComment("");
    } catch (error) {
      console.error("❌ Failed to add comment:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResolveComment = async (commentId: string) => {
    try {
      const response = await fetch(`/api/comments/${commentId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          resolved: true,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to resolve comment");
      }

      const updatedComment = await response.json();
      console.log("✅ Comment resolved:", updatedComment);

      if (onResolveComment) {
        onResolveComment(commentId);
      }
    } catch (error) {
      console.error("❌ Failed to resolve comment:", error);
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInMs < 30000) {
      return "Just now"; // Less than 30 seconds
    } else if (diffInMinutes < 1) {
      return `${Math.floor(diffInMs / 1000)}s ago`; // Seconds
    } else if (diffInMinutes < 60) {
      return `${diffInMinutes}m ago`; // Minutes
    } else if (diffInHours < 24) {
      return `${diffInHours}h ago`; // Hours
    } else if (diffInDays < 7) {
      return `${diffInDays}d ago`; // Days
    } else if (diffInDays < 30) {
      const weeks = Math.floor(diffInDays / 7);
      return `${weeks}w ago`; // Weeks
    } else {
      // For older comments, show the actual date
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
      });
    }
  };

  const getDisplayName = (author: Comment["author"]) => {
    return author.name || author.email;
  };

  const getInitials = (author: Comment["author"]) => {
    if (author.name) {
      return author.name
        .split(" ")
        .map(n => n[0])
        .join("")
        .toUpperCase();
    }
    return author.email[0]?.toUpperCase() || "U";
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
          style={{ height: "calc(100vh - 73px)" }}
        >
          {/* Header - Fixed */}
          <div className="flex-shrink-0 border-b border-slate-200 p-4 dark:border-slate-700">
            <div className="flex items-center justify-between">
              <h3 className="flex items-center font-semibold">
                <MessageCircle className="mr-2 h-4 w-4" />
                Comments ({comments.length})
              </h3>
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Scrollable Comments Area */}
          <ScrollArea className="flex-1">
            <div className="space-y-4 p-4">
              {comments.length > 0 ? (
                comments.map(comment => {
                  const isCurrentUser = comment.author.id === session?.user?.id;
                  const realAvatarUrl = getRealAvatarUrl(comment.author);

                  return (
                    <motion.div
                      key={comment.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`rounded-lg border p-3 ${
                        comment.resolved
                          ? "border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20"
                          : "border-slate-200 bg-slate-50 dark:border-slate-600 dark:bg-slate-700"
                      }`}
                    >
                      <div className="flex items-start space-x-3">
                        <Avatar
                          className={`h-6 w-6 ${
                            isCurrentUser
                              ? "ring-2 ring-blue-500 ring-offset-1 dark:ring-blue-400"
                              : ""
                          }`}
                        >
                          <AvatarImage src={realAvatarUrl} />
                          <AvatarFallback>
                            {getInitials(comment.author)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="mb-1 flex items-center justify-between">
                            <span
                              className={`text-sm font-medium ${
                                isCurrentUser
                                  ? "text-blue-600 dark:text-blue-400"
                                  : ""
                              }`}
                            >
                              {comment.author.name || comment.author.email}
                              {isCurrentUser && (
                                <span className="ml-1 text-xs text-blue-500">
                                  (You)
                                </span>
                              )}
                            </span>
                            <span className="text-xs text-slate-500">
                              {formatTimestamp(comment.createdAt)}
                            </span>
                          </div>
                          <p className="text-sm text-slate-700 dark:text-slate-300">
                            {comment.content}
                          </p>
                          <div className="mt-2 flex items-center justify-between">
                            {comment.resolved ? (
                              <Badge variant="secondary" className="text-xs">
                                <Check className="mr-1 h-3 w-3" />
                                Resolved
                              </Badge>
                            ) : (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleResolveComment(comment.id)}
                                className="text-xs"
                              >
                                <Check className="mr-1 h-3 w-3" />
                                Resolve
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })
              ) : (
                <div className="text-center text-slate-500 dark:text-slate-400">
                  <MessageCircle className="mx-auto mb-2 h-8 w-8 opacity-50" />
                  <p className="text-sm">No comments yet</p>
                  <p className="text-xs">Start a conversation!</p>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Comment Input - Fixed at bottom */}
          <div className="flex-shrink-0 border-t border-slate-200 p-4 dark:border-slate-700">
            <div className="flex space-x-2">
              <Textarea
                placeholder="Add a comment..."
                value={newComment}
                onChange={e => setNewComment(e.target.value)}
                className="min-h-[60px] flex-1 resize-none"
                onKeyDown={e => {
                  if (e.key === "Enter" && e.ctrlKey) {
                    handleSubmitComment();
                  }
                }}
                disabled={isSubmitting}
              />
              <Button
                size="sm"
                className="self-end"
                onClick={handleSubmitComment}
                disabled={!newComment.trim() || isSubmitting}
              >
                {isSubmitting ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-background border-t-foreground" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
            <p className="mt-1 text-xs text-slate-500">
              Press Ctrl+Enter to send
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
