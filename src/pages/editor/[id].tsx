"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import LexicalEditor from "@/components/lexical/editor/LexicalEditor";
import EditorHeader, {
  type DocumentMode,
  type UserRole,
} from "@/components/documents/EditorHeader";
import CommentsPanel from "@/components/documents/CommentsPanel";
import AiAssistantPanel from "@/components/documents/AiAssistantPanel";
import { useUser } from "@clerk/nextjs";

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
  const { user, isLoaded } = useUser();

  // UI State
  const [showComments, setShowComments] = useState(false);
  const [showAI, setShowAI] = useState(false);

  // Document editing mode management
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

  // Redirect if not authenticated
  useEffect(() => {
    if (isLoaded && !user) {
      router.replace("/welcome");
    }
  }, [isLoaded, user, router]);

  // Fetch data on mount and when ID changes
  useEffect(() => {
    if (!id || typeof id !== "string" || !isLoaded || !user) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch real document from API
        const response = await fetch(`/api/documents/${id}`);

        if (!response.ok) {
          if (response.status === 404) {
            setError("Document not found");
          } else {
            setError("Failed to load document");
          }
          return;
        }

        const docData = await response.json();
        console.log("Loaded document:", docData);

        // Transform API response to match existing DocumentData interface
        const transformedDoc: DocumentData = {
          id: docData.id,
          title: docData.title,
          content: docData.content,
          lastModified: new Date(docData.updatedAt).toLocaleDateString(),
          createdAt: docData.createdAt
            ? new Date(docData.createdAt).toLocaleDateString()
            : "",
          ownerId: docData.ownerId ?? "",
          collaboratorIds: docData.collaboratorIds ?? [],
        };

        setDocument(transformedDoc);

        // Keep mock data for other features for now
        const [commentsData, collaboratorsData, aiData] = await Promise.all([
          getComments(id),
          getCollaborators(id),
          getAISuggestions(id),
        ]);

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
  }, [id, userRole, isLoaded, user]);

  // Handle document title change
  const handleTitleChange = async (newTitle: string) => {
    if (!document) return;

    try {
      setDocument(prev => (prev ? { ...prev, title: newTitle } : null));

      // Update in backend/mock data
      const updatedDoc = await updateDocument(document.id, { title: newTitle });
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
  };

  // Handle content change
  const handleContentChange = async (newContent: string) => {
    if (!document) return;

    try {
      setDocument(prev => (prev ? { ...prev, content: newContent } : null));

      // Update in backend/mock data
      await updateDocument(document.id, { content: newContent });
    } catch (err) {
      console.error("Failed to update document content:", err);
      // Revert on error
      if (document) {
        setDocument(prev =>
          prev ? { ...prev, content: document.content } : null
        );
      }
    }
  };

  // Calculate unread comments count
  const unreadCommentsCount = comments.filter(c => !c.resolved).length;

  // Show loading while checking auth
  if (!isLoaded || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-slate-900 dark:to-slate-800">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600"></div>
      </div>
    );
  }

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
                    readOnly={mode === "viewing"}
                    initialContent={document.content}
                    onContentChange={handleContentChange}
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
