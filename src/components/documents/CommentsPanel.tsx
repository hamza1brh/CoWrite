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
  id: number;
  author: string;
  avatar: string;
  content: string;
  timestamp: string;
  resolved: boolean;
  replies?: Comment[];
}

interface CommentsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  comments: Comment[];
  onAddComment?: (content: string) => void;
  onResolveComment?: (commentId: number) => void;
}

export default function CommentsPanel({
  isOpen,
  onClose,
  comments,
  onAddComment,
  onResolveComment,
}: CommentsPanelProps) {
  const [newComment, setNewComment] = useState("");

  const handleSubmitComment = () => {
    if (newComment.trim() && onAddComment) {
      onAddComment(newComment.trim());
      setNewComment("");
    }
  };

  const handleResolveComment = (commentId: number) => {
    if (onResolveComment) {
      onResolveComment(commentId);
    }
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
          style={{ height: "calc(100vh - 73px)" }} // Fixed height minus header height
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
                        <AvatarImage
                          src={comment.avatar || "/placeholder.svg"}
                        />
                        <AvatarFallback>
                          {comment.author
                            .split(" ")
                            .map(n => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="mb-1 flex items-center justify-between">
                          <span className="text-sm font-medium">
                            {comment.author}
                          </span>
                          <span className="text-xs text-slate-500">
                            {comment.timestamp}
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

                        {/* Render replies if they exist */}
                        {comment.replies && comment.replies.length > 0 && (
                          <div className="mt-3 space-y-2 border-l-2 border-slate-200 pl-3 dark:border-slate-600">
                            {comment.replies.map(reply => (
                              <div key={reply.id} className="text-sm">
                                <div className="flex items-center space-x-2">
                                  <Avatar className="h-4 w-4">
                                    <AvatarImage
                                      src={reply.avatar || "/placeholder.svg"}
                                    />
                                    <AvatarFallback className="text-xs">
                                      {reply.author
                                        .split(" ")
                                        .map(n => n[0])
                                        .join("")}
                                    </AvatarFallback>
                                  </Avatar>
                                  <span className="font-medium">
                                    {reply.author}
                                  </span>
                                  <span className="text-xs text-slate-400">
                                    {reply.timestamp}
                                  </span>
                                </div>
                                <p className="mt-1 text-slate-600 dark:text-slate-400">
                                  {reply.content}
                                </p>
                              </div>
                            ))}
                          </div>
                        )}
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
          {onAddComment && (
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
                />
                <Button
                  size="sm"
                  className="self-end"
                  onClick={handleSubmitComment}
                  disabled={!newComment.trim()}
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
              <p className="mt-1 text-xs text-slate-500">
                Press Ctrl+Enter to send
              </p>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
