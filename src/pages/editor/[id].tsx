"use client";

import { useState, useEffect, useCallback, useRef } from "react";
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
import { useAutoSave } from "@/hooks/useAutoSave";

import type {
  DocumentWithDetails,
  CollaboratorWithUser,
} from "@/lib/types/api";
import { getCollaborators, type Collaborator } from "@/data/mockUsers";
import { getAISuggestions, type AISuggestion } from "@/data/mockAi";

interface EditorDocument {
  id: string;
  title: string;
  content: string;
  ownerId: string;
  collaborators: CollaboratorWithUser[];
  isPublic: boolean;
  lastModified: string;
  createdAt: string;
}

interface ApiComment {
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

export default function DocumentEditor() {
  const router = useRouter();
  const { id } = router.query;
  const { user, isLoaded } = useUser();

  // UI State
  const [showComments, setShowComments] = useState(false);
  const [showAI, setShowAI] = useState(false);
  const [mode, setMode] = useState<DocumentMode>("viewing");

  // Data State
  const [document, setDocument] = useState<EditorDocument | null>(null);
  const [comments, setComments] = useState<ApiComment[]>([]);
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [aiSuggestions, setAiSuggestions] = useState<AISuggestion[]>([]);

  // Loading States
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Content refs
  const lastSavedContentRef = useRef<string>("");
  const isInitialLoadRef = useRef(true);

  //  user role calculation
  const getUserRole = useCallback((): UserRole => {
    if (!document || !user) return "viewer";

    // Check if user is the document owner
    if (document.ownerId === user.id) {
      return "owner";
    }

    // Check collaborators (when the API is ready)
    if (document.collaborators && document.collaborators.length > 0) {
      const userCollaboration = document.collaborators.find(
        collab => collab.user.clerkId === user.id
      );

      if (userCollaboration) {
        //  Prisma Role enum to UserRole
        switch (userCollaboration.role) {
          case "OWNER":
            return "owner";
          case "EDITOR":
            return "editor";
          case "VIEWER":
            return "viewer";
          default:
            return "viewer";
        }
      }
    }

    // ✅ Future: Check if document is public
    if (document.isPublic) {
      return "viewer";
    }

    // ✅ Current fallback: For now, give edit access to authenticated users
    // TODO: Remove this when collaborator management is implemented
    return "editor";
  }, [document, user]);

  // Calculate user role dynamically
  const userRole = getUserRole();

  // Redirect if not authenticated
  useEffect(() => {
    if (isLoaded && !user) {
      router.replace("/welcome");
    }
  }, [isLoaded, user, router]);

  // Fetch document
  useEffect(() => {
    if (!id || typeof id !== "string" || !isLoaded || !user) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch document
        const response = await fetch(`/api/documents/${id}`);

        if (!response.ok) {
          if (response.status === 404) {
            setError("Document not found");
          } else if (response.status === 403) {
            setError("You don't have permission to access this document");
          } else {
            setError("Failed to load document");
          }
          return;
        }

        const docData = await response.json();
        console.log("Loaded document:", docData);

        const transformedDoc: EditorDocument = {
          id: docData.id,
          title: docData.title,
          content:
            typeof docData.content === "string"
              ? docData.content
              : JSON.stringify(docData.content || {}),
          ownerId: docData.ownerId,
          collaborators: docData.collaborators || [],
          isPublic: docData.isPublic || false,
          lastModified: new Date(docData.updatedAt).toLocaleDateString(),
          createdAt: new Date(docData.createdAt).toLocaleDateString(),
        };

        setDocument(transformedDoc);
        lastSavedContentRef.current = transformedDoc.content;
        isInitialLoadRef.current = true;

        const [commentsResponse, collaboratorsData, aiData] = await Promise.all(
          [
            fetch(`/api/documents/${id}/comments`),
            // Keep mock data for now
            getCollaborators(id),
            getAISuggestions(id),
          ]
        );

        if (commentsResponse.ok) {
          const commentsData = await commentsResponse.json();
          setComments(commentsData);
          console.log("✅ Loaded comments:", commentsData.length);
        } else {
          console.warn("❌ Failed to load comments:", commentsResponse.status);
          setComments([]);
        }

        setCollaborators(collaboratorsData);
        setAiSuggestions(aiData);
      } catch (err) {
        console.error("❌ Error fetching document:", err);
        setError("Failed to load document data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, isLoaded, user]);

  // Set editing mode based on user role
  useEffect(() => {
    if (document) {
      if (userRole === "owner" || userRole === "editor") {
        setMode("editing");
      } else {
        setMode("viewing");
      }
    }
  }, [document, userRole]);

  // Auto-save hook
  const { save: autoSave } = useAutoSave({
    saveFunction: async (data: { content?: string }) => {
      if (!document) return;

      console.log("💾 Auto-save triggered");

      const response = await fetch(`/api/documents/${document.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Save failed: ${response.status} - ${errorText}`);
      }

      console.log("✅ Content auto-saved");

      if (data.content) {
        lastSavedContentRef.current = data.content;
      }
    },
    debounceMs: 2000,
    intervalMs: 30000,
    enabled: mode === "editing",
  });

  // Handle title change
  const handleTitleChange = async (newTitle: string): Promise<void> => {
    if (!document) return;

    try {
      setDocument(prev => (prev ? { ...prev, title: newTitle } : null));

      console.log("💾 Saving title:", newTitle);

      const response = await fetch(`/api/documents/${document.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ title: newTitle }),
      });

      if (!response.ok) {
        throw new Error(`Failed to save title: ${response.status}`);
      }

      console.log("✅ Title saved");
    } catch (err) {
      console.error("❌ Failed to save title:", err);
      if (document) {
        setDocument(prev => (prev ? { ...prev, title: document.title } : null));
      }
      throw err;
    }
  };

  // Handle mode change
  const handleModeChange = (newMode: DocumentMode) => {
    // ✅ Only allow mode changes if user has permission
    if (newMode === "editing" && userRole === "viewer") {
      console.log("❌ User doesn't have edit permissions");
      return;
    }
    setMode(newMode);
    console.log(`📱 Mode changed to: ${newMode}`);
  };

  // Handle content change
  const handleContentChange = useCallback(
    (editorState: any) => {
      if (!document) return;

      try {
        const contentString = JSON.stringify(editorState);

        if (
          isInitialLoadRef.current &&
          contentString === lastSavedContentRef.current
        ) {
          isInitialLoadRef.current = false;
          return;
        }

        if (contentString === lastSavedContentRef.current) {
          return;
        }

        isInitialLoadRef.current = false;

        setDocument(prev =>
          prev ? { ...prev, content: contentString } : null
        );

        autoSave({ content: contentString });
      } catch (err) {
        console.error("❌ Failed to process content change:", err);
      }
    },
    [document, autoSave]
  );

  const handleAddComment = (newCommentData: ApiComment) => {
    setComments(prev => [newCommentData, ...prev]);
    console.log("✅ Comment added to state:", newCommentData);
  };

  const handleResolveComment = (commentId: string) => {
    setComments(prev =>
      prev.map(comment =>
        comment.id === commentId ? { ...comment, resolved: true } : comment
      )
    );
    console.log("✅ Comment resolved in state:", commentId);
  };

  // Calculate unread comments count
  const unreadCommentsCount = comments.filter(c => !c.resolved).length;

  // Loading state
  if (!isLoaded || !user || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !document) {
    return (
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <div className="flex min-h-screen items-center justify-center">
            <div className="text-center">
              <p className="mb-4 text-lg text-red-600">
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
        </SidebarInset>
      </SidebarProvider>
    );
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <div className="dark:dark-gradient-bg flex min-h-screen flex-col bg-slate-50">
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
            userRole={userRole} // ✅ Now properly calculated
            onModeChange={handleModeChange}
            isDocumentOwner={userRole === "owner"}
          />

          <div className="flex flex-1 overflow-hidden">
            <div className="flex flex-1 flex-col">
              <div className="relative flex-1 overflow-auto p-4 sm:p-6">
                <div className="mx-auto max-w-3xl rounded-lg border border-slate-200/30 dark:border-slate-700/20 sm:max-w-4xl lg:max-w-5xl xl:max-w-6xl">
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

            {/* Desktop Panels */}
            <div className="hidden lg:flex">
              {showAI && (
                <div className="w-80 border-l border-slate-200/50 bg-white/60 backdrop-blur-sm dark:border-slate-700/20 dark:bg-slate-800/60">
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
                <div className="w-80 border-l border-slate-200/50 bg-white/60 backdrop-blur-sm dark:border-slate-700/20 dark:bg-slate-800/60">
                  <CommentsPanel
                    isOpen={true}
                    onClose={() => setShowComments(false)}
                    comments={comments}
                    documentId={document.id}
                    onAddComment={handleAddComment}
                    onResolveComment={handleResolveComment}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Mobile Panels */}
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
                  documentId={document.id}
                  onAddComment={handleAddComment}
                  onResolveComment={handleResolveComment}
                />
              </div>
            )}
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
