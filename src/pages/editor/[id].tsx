"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/router";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import LexicalEditor from "@/components/lexical/editor/LexicalEditor";
import EditorHeader, {
  type DocumentMode,
  type UserRole,
  type Collaborator,
} from "@/components/documents/EditorHeader";
import CommentsPanel from "@/components/documents/CommentsPanel";
import AiAssistantPanel from "@/components/documents/AiAssistantPanel";
import CollaboratorPanel from "@/components/documents/CollaboratorPanel";
import { useUser } from "@clerk/nextjs";
import { useAutoSave } from "@/hooks/useAutoSave";

import type {
  DocumentWithDetails,
  CollaboratorWithUser,
} from "@/lib/types/api";
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

interface ApiCollaborator {
  id: string;
  role: "OWNER" | "EDITOR" | "VIEWER";
  joinedAt: string;
  documentId: string;
  userId: string;
  user: {
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
  const { user: clerkUser, isLoaded } = useUser();

  const [databaseUser, setDatabaseUser] = useState<any>(null);

  // UI State
  const [showComments, setShowComments] = useState(false);
  const [showAI, setShowAI] = useState(false);
  const [showCollaborators, setShowCollaborators] = useState(false);
  const [mode, setMode] = useState<DocumentMode>("viewing");

  // Data State
  const [document, setDocument] = useState<EditorDocument | null>(null);
  const [comments, setComments] = useState<ApiComment[]>([]);
  const [collaborators, setCollaborators] = useState<ApiCollaborator[]>([]);
  const [aiSuggestions, setAiSuggestions] = useState<AISuggestion[]>([]);

  // Loading States
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Content refs
  const lastSavedContentRef = useRef<string>("");
  const isInitialLoadRef = useRef(true);

  //  Transform API collaborators to EditorHeader Collaborator format
  const transformCollaboratorsForHeader = useCallback(
    (apiCollaborators: ApiCollaborator[]): Collaborator[] => {
      return apiCollaborators.map(collab => ({
        id: collab.id,
        name:
          `${collab.user.firstName} ${collab.user.lastName}`.trim() ||
          collab.user.email,
        email: collab.user.email,
        avatar: collab.user.imageUrl,
        status: "offline" as const, // TODO: Implement real-time presence
        role: collab.role.toLowerCase() as "owner" | "editor" | "viewer",
        // ✅ Add optional cursor property (can be undefined)
        cursor: undefined,
      }));
    },
    []
  );

  const getUserRole = useCallback((): UserRole => {
    if (!document || !databaseUser) return "viewer";

    console.log("🔍 getUserRole Debug:", {
      documentOwnerId: document.ownerId,
      databaseUserId: databaseUser.id, 
      clerkUserId: clerkUser?.id,
      isOwnerByDocumentId: document.ownerId === databaseUser.id,
      collaboratorsCount: collaborators.length,
      collaboratorsDetailed: collaborators.map(c => ({
        id: c.id,
        userId: c.userId,
        role: c.role,
        email: c.user?.email,
        matchesUserId: c.userId === databaseUser.id, 
      })),
    });

    // ✅ Check if user is the document owner 
    if (document.ownerId === databaseUser.id) {
      console.log("✅ User is document owner");
      return "owner";
    }

    if (collaborators && collaborators.length > 0) {
      // ✅ Find collaboration using database user ID
      const userCollaboration = collaborators.find(
        collab => collab.userId === databaseUser.id
      );

      console.log("🔍 User collaboration found:", userCollaboration);

      if (userCollaboration) {
        console.log("✅ User collaboration role:", userCollaboration.role);

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

    if (document.isPublic) {
      console.log("📖 Document is public, user is viewer");
      return "viewer";
    }

    console.log("❌ No role found, defaulting to viewer");
    return "viewer";
  }, [document, databaseUser, clerkUser?.id, collaborators]);

  // Calculate user role dynamically
  const userRole = getUserRole();

  useEffect(() => {
    if (!isLoaded || !clerkUser) return;

    const fetchOrCreateDatabaseUser = async () => {
      try {
        console.log("🔍 Fetching/creating database user for:", {
          clerkUserId: clerkUser.id,
          email: clerkUser.primaryEmailAddress?.emailAddress,
        });

        
        const response = await fetch("/api/users/me");

        if (response.ok) {
          const dbUser = await response.json();
          setDatabaseUser(dbUser);
          console.log("✅ Database user found:", dbUser);
          return;
        }

        
        console.log("🔄 User not found, attempting to create/sync...");

        const createResponse = await fetch("/api/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            clerkId: clerkUser.id,
            email: clerkUser.primaryEmailAddress?.emailAddress || "",
            firstName: clerkUser.firstName || "",
            lastName: clerkUser.lastName || "",
            imageUrl: clerkUser.imageUrl || "",
          }),
        });

        if (createResponse.ok) {
          const newUser = await createResponse.json();
          setDatabaseUser(newUser);
          console.log("✅ Database user created/synced:", newUser);
        } else {
          const errorData = await createResponse.json();
          console.error("❌ Failed to create/sync user:", errorData);
        }
      } catch (error) {
        console.error("❌ Error in user fetch/create:", error);
      }
    };

    fetchOrCreateDatabaseUser();
  }, [isLoaded, clerkUser]);

  // Redirect if not authenticated
  useEffect(() => {
    if (isLoaded && !clerkUser) {
      router.replace("/welcome");
    }
  }, [isLoaded, clerkUser, router]);

  // Fetch document
  useEffect(() => {
    if (
      !id ||
      typeof id !== "string" ||
      !isLoaded ||
      !clerkUser ||
      !databaseUser
    )
      return;

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

        const [commentsResponse, collaboratorsResponse, aiData] =
          await Promise.all([
            fetch(`/api/documents/${id}/comments`),
            fetch(`/api/documents/${id}/collaborators`),
            getAISuggestions(id),
          ]);

        if (commentsResponse.ok) {
          const commentsData = await commentsResponse.json();
          setComments(commentsData);
          console.log("✅ Loaded comments:", commentsData.length);
        } else {
          console.warn("❌ Failed to load comments:", commentsResponse.status);
          setComments([]);
        }

        if (collaboratorsResponse.ok) {
          const collaboratorsData = await collaboratorsResponse.json();
          setCollaborators(collaboratorsData);
          console.log("✅ Loaded collaborators:", collaboratorsData.length);
        } else {
          console.warn(
            "❌ Failed to load collaborators:",
            collaboratorsResponse.status
          );
          setCollaborators([]);
        }

        setAiSuggestions(aiData);
      } catch (err) {
        console.error("❌ Error fetching document:", err);
        setError("Failed to load document data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, isLoaded, clerkUser, databaseUser]);

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

  // Collaborator management functions
  const handleAddCollaborator = async (
    email: string,
    role: "EDITOR" | "VIEWER"
  ) => {
    if (!document) return;

    try {
      const response = await fetch(
        `/api/documents/${document.id}/collaborators`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email,
            role,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to add collaborator");
      }

      const newCollaborator = await response.json();
      setCollaborators(prev => [...prev, newCollaborator]);
      console.log("✅ Collaborator added:", newCollaborator);
    } catch (error) {
      console.error("❌ Failed to add collaborator:", error);
      throw error;
    }
  };

  const handleRemoveCollaborator = async (collaboratorId: string) => {
    if (!document) return;

    try {
      const response = await fetch(
        `/api/documents/${document.id}/collaborators/${collaboratorId}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        throw new Error("Failed to remove collaborator");
      }

      setCollaborators(prev => prev.filter(c => c.id !== collaboratorId));
      console.log("✅ Collaborator removed:", collaboratorId);
    } catch (error) {
      console.error("❌ Failed to remove collaborator:", error);
      throw error;
    }
  };

  const handleChangeRole = async (
    collaboratorId: string,
    role: "EDITOR" | "VIEWER"
  ) => {
    if (!document) return;

    try {
      const response = await fetch(
        `/api/documents/${document.id}/collaborators/${collaboratorId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ role }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to change role");
      }

      const updatedCollaborator = await response.json();

      // Update collaborators state
      setCollaborators(prev =>
        prev.map(c =>
          c.id === collaboratorId
            ? { ...c, role: role as "OWNER" | "EDITOR" | "VIEWER" }
            : c
        )
      );

      console.log("✅ Collaborator role changed:", updatedCollaborator);
    } catch (error) {
      console.error("❌ Failed to change role:", error);
      throw error;
    }
  };

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
  if (!isLoaded || !clerkUser || !databaseUser || loading) {
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
            collaborators={transformCollaboratorsForHeader(collaborators)}
            showAI={showAI}
            showComments={showComments}
            onToggleAI={() => setShowAI(!showAI)}
            onToggleComments={() => setShowComments(!showComments)}
            unreadCommentsCount={unreadCommentsCount}
            mode={mode}
            userRole={userRole}
            onModeChange={handleModeChange}
            isDocumentOwner={userRole === "owner"}
            onAddCollaborator={handleAddCollaborator}
            onRemoveCollaborator={handleRemoveCollaborator}
            onChangeRole={handleChangeRole}
            showCollaborators={showCollaborators}
            onToggleCollaborators={() =>
              setShowCollaborators(!showCollaborators)
            }
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
              {showCollaborators && (
                <div className="w-80 border-l border-slate-200/50 bg-white/60 backdrop-blur-sm dark:border-slate-700/20 dark:bg-slate-800/60">
                  <CollaboratorPanel
                    isOpen={true}
                    onClose={() => setShowCollaborators(false)}
                    collaborators={transformCollaboratorsForHeader(
                      collaborators
                    )}
                    currentUserRole={userRole}
                    onAddCollaborator={handleAddCollaborator}
                    onRemoveCollaborator={handleRemoveCollaborator}
                    onChangeRole={handleChangeRole}
                  />
                </div>
              )}

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
            {(showAI || showComments || showCollaborators) && (
              <div
                className="fixed inset-0 z-50 bg-black/50"
                onClick={() => {
                  setShowAI(false);
                  setShowComments(false);
                  setShowCollaborators(false);
                }}
              />
            )}

            {showCollaborators && (
              <div className="fixed right-0 top-0 z-50 h-full w-full max-w-sm bg-white shadow-xl dark:bg-slate-900">
                <CollaboratorPanel
                  isOpen={true}
                  onClose={() => setShowCollaborators(false)}
                  collaborators={transformCollaboratorsForHeader(collaborators)}
                  currentUserRole={userRole}
                  onAddCollaborator={handleAddCollaborator}
                  onRemoveCollaborator={handleRemoveCollaborator}
                  onChangeRole={handleChangeRole}
                />
              </div>
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
