"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
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
  const [newComment, setNewComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

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
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      return "Just now";
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const getDisplayName = (author: Comment["author"]) => {
    return `${author.firstName} ${author.lastName}`.trim() || author.email;
  };

  const getInitials = (author: Comment["author"]) => {
    const firstName = author.firstName || "";
    const lastName = author.lastName || "";
    if (firstName && lastName) {
      return `${firstName[0]}${lastName[0]}`.toUpperCase();
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
                comments.map(comment => (
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
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={comment.author.imageUrl} />
                        <AvatarFallback>
                          {getInitials(comment.author)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="mb-1 flex items-center justify-between">
                          <span className="text-sm font-medium">
                            {getDisplayName(comment.author)}
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
                ))
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
