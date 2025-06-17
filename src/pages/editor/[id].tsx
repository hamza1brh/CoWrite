"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { motion } from "framer-motion";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import LexicalEditor from "@/components/lexical/editor/LexicalEditor";
import EditorHeader, {
  type DocumentMode,
  type UserRole,
} from "@/components/documents/EditorHeader";
import CommentsPanel from "@/components/documents/CommentsPanel";
import AiAssistantPanel from "@/components/documents/AiAssistantPanel";

// Fixed data imports - use the correct files
import {
  getDocument,
  updateDocument,
  type DocumentData,
} from "@/data/mockDocuments";
import { getComments, addComment, type Comment } from "@/data/mockComments";
import { getCollaborators, type Collaborator } from "@/data/mockUsers";
import { getAISuggestions, type AISuggestion } from "@/data/mockAi";

export default function DocumentEditor() {
  const router = useRouter();
  const { id } = router.query;

  // UI State
  const [showComments, setShowComments] = useState(false);
  const [showAI, setShowAI] = useState(false);

  // New state for mode management
  const [mode, setMode] = useState<DocumentMode>("viewing");
  const [userRole, setUserRole] = useState<UserRole>("editor"); // This will come from auth later

  // Data State
  const [document, setDocument] = useState<DocumentData | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [aiSuggestions, setAiSuggestions] = useState<AISuggestion[]>([]);

  // Loading States
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch data on mount and when ID changes
  useEffect(() => {
    if (!id || typeof id !== "string") return;

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const [docData, commentsData, collaboratorsData, aiData] =
          await Promise.all([
            getDocument(id),
            getComments(id),
            getCollaborators(id),
            getAISuggestions(id),
          ]);

        if (!docData) {
          setError("Document not found");
          return;
        }

        setDocument(docData);
        setComments(commentsData);
        setCollaborators(collaboratorsData);
        setAiSuggestions(aiData);

        // Auto-switch to editing mode if user can edit
        if (userRole === "owner" || userRole === "editor") {
          setMode("editing");
        }
      } catch (err) {
        setError("Failed to load document data");
        console.error("Error fetching document data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, userRole]);

  // Handle document title change
  const handleTitleChange = async (newTitle: string) => {
    if (!document) return; // Only check if document exists

    try {
      // Update local state immediately for responsive UI
      setDocument(prev => (prev ? { ...prev, title: newTitle } : null));

      // Update in backend/mock data
      const updatedDoc = await updateDocument(document.id, { title: newTitle });

      // Sync with updated document if needed (optional, since we already updated locally)
      // setDocument(updatedDoc);
    } catch (err) {
      console.error("Failed to update document title:", err);
      // Revert on error
      if (document) {
        setDocument(prev => (prev ? { ...prev, title: document.title } : null));
      }
    }
  };

  // Handle mode change
  const handleModeChange = (newMode: DocumentMode) => {
    setMode(newMode);
    // You can add additional logic here, like showing notifications
    console.log(`Switched to ${newMode} mode`);
  };

  // Calculate unread comments count
  const unreadCommentsCount = comments.filter(c => !c.resolved).length;

  // Loading state
  if (loading) {
    return (
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <div className="dark:dark-gradient-bg flex min-h-screen flex-col bg-slate-50">
            <div className="flex h-64 items-center justify-center">
              <div className="text-center">
                <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-blue-600 border-t-transparent"></div>
                <p className="text-slate-600 dark:text-slate-400">
                  Loading document...
                </p>
              </div>
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    );
  }

  // Error state
  if (error || !document) {
    return (
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <div className="dark:dark-gradient-bg flex min-h-screen flex-col bg-slate-50">
            <div className="flex h-64 items-center justify-center">
              <div className="text-center">
                <p className="mb-4 text-lg text-red-600 dark:text-red-400">
                  {error || "Document not found"}
                </p>
                <button
                  onClick={() => router.push("/")}
                  className="text-blue-600 underline hover:text-blue-800"
                >
                  Return to Dashboard
                </button>
              </div>
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    );
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <div className="dark:dark-gradient-bg flex min-h-screen flex-col bg-slate-50">
          {/* Header */}
          <EditorHeader
            documentTitle={document.title}
            onTitleChange={handleTitleChange}
            collaborators={collaborators}
            showAI={showAI}
            showComments={showComments}
            onToggleAI={() => setShowAI(!showAI)}
            onToggleComments={() => setShowComments(!showComments)}
            unreadCommentsCount={unreadCommentsCount}
            mode={mode}
            userRole={userRole}
            onModeChange={handleModeChange}
            isDocumentOwner={userRole === "owner"}
          />

          <div className="flex flex-1 overflow-hidden">
            {/* Main Editor */}
            <div className="flex flex-1 flex-col">
              {/* Editor Content */}
              <div className="relative flex-1 overflow-auto p-4 sm:p-6">
                {/* Document Container */}
                <div className="mx-auto max-w-3xl rounded-lg border border-slate-200/30 dark:border-slate-700/20 sm:max-w-4xl lg:max-w-5xl xl:max-w-6xl">
                  {/* Lexical Editor */}
                  <LexicalEditor
                    showToolbar={mode === "editing"}
                    className="min-h-full"
                    documentId={document.id}
                    key={document.id}
                    readOnly={mode === "viewing"}
                  />
                </div>
              </div>
            </div>

            {/* Desktop Panels - Only render on larger screens */}
            <div className="hidden lg:flex">
              <AiAssistantPanel
                isOpen={showAI}
                onClose={() => setShowAI(false)}
                suggestions={aiSuggestions}
                onRefreshSuggestions={async () => {
                  if (!document?.id) return;
                  try {
                    const newSuggestions = await getAISuggestions(document.id);
                    setAiSuggestions(newSuggestions);
                  } catch (err) {
                    console.error("Failed to refresh AI suggestions:", err);
                  }
                }}
              />

              <CommentsPanel
                isOpen={showComments}
                onClose={() => setShowComments(false)}
                comments={comments}
                onAddComment={async (content: string) => {
                  if (!document?.id) return;
                  try {
                    const newComment = await addComment(
                      document.id,
                      content,
                      "Current User"
                    );
                    setComments(prev => [...prev, newComment]);
                  } catch (err) {
                    console.error("Failed to add comment:", err);
                  }
                }}
                onResolveComment={async (commentId: number) => {
                  try {
                    setComments(prev =>
                      prev.map(c =>
                        c.id === commentId ? { ...c, resolved: true } : c
                      )
                    );
                  } catch (err) {
                    console.error("Failed to resolve comment:", err);
                  }
                }}
              />
            </div>
          </div>

          {/* Mobile Panels - Overlay/Modal style */}
          <div className="lg:hidden">
            {(showAI || showComments) && (
              <div
                className="fixed inset-0 z-50 bg-black/50"
                onClick={() => {
                  setShowAI(false);
                  setShowComments(false);
                }}
              />
            )}

            {showAI && (
              <div className="fixed right-0 top-0 z-50 h-full w-full max-w-sm bg-white shadow-xl dark:bg-slate-900">
                <AiAssistantPanel
                  isOpen={true}
                  onClose={() => setShowAI(false)}
                  suggestions={aiSuggestions}
                  onRefreshSuggestions={async () => {
                    if (!document?.id) return;
                    try {
                      const newSuggestions = await getAISuggestions(
                        document.id
                      );
                      setAiSuggestions(newSuggestions);
                    } catch (err) {
                      console.error("Failed to refresh AI suggestions:", err);
                    }
                  }}
                />
              </div>
            )}

            {showComments && (
              <div className="fixed right-0 top-0 z-50 h-full w-full max-w-sm bg-white shadow-xl dark:bg-slate-900">
                <CommentsPanel
                  isOpen={true}
                  onClose={() => setShowComments(false)}
                  comments={comments}
                  onAddComment={async (content: string) => {
                    if (!document?.id) return;
                    try {
                      const newComment = await addComment(
                        document.id,
                        content,
                        "Current User"
                      );
                      setComments(prev => [...prev, newComment]);
                    } catch (err) {
                      console.error("Failed to add comment:", err);
                    }
                  }}
                  onResolveComment={async (commentId: number) => {
                    try {
                      setComments(prev =>
                        prev.map(c =>
                          c.id === commentId ? { ...c, resolved: true } : c
                        )
                      );
                    } catch (err) {
                      console.error("Failed to resolve comment:", err);
                    }
                  }}
                />
              </div>
            )}
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
