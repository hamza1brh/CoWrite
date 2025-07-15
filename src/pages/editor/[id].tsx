"use client";

import {
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
  Component,
  ReactNode,
} from "react";
import { useRouter } from "next/router";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import LexicalEditor, {
  DEFAULT_EDITOR_STATE,
} from "@/components/lexical/editor/LexicalEditor";
import EditorHeader, {
  type DocumentMode,
  type UserRole,
  type Collaborator,
} from "@/components/documents/EditorHeader";
import CommentsPanel from "@/components/documents/CommentsPanel";
import AiAssistantPanel from "@/components/documents/AiAssistantPanel";
import CollaboratorPanel from "@/components/documents/CollaboratorPanel";
import { useSession } from "next-auth/react";

import type { CollaboratorWithUser } from "@/lib/types/api";

// AI Suggestion type definition (matches AiAssistantPanel component)
interface AISuggestion {
  id: string;
  type: "improvement" | "addition" | "correction" | "formatting";
  title: string;
  description: string;
  confidence: number;
  appliedAt?: string;
}

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

// Simple Error Boundary Component
class ErrorBoundary extends Component<
  { children: ReactNode; fallback: ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: ReactNode; fallback: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error("Editor Error Boundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }

    return this.props.children;
  }
}

export default function DocumentEditor() {
  const router = useRouter();
  const { id } = router.query;
  const { data: session, status } = useSession();
  const isLoaded = status !== "loading";

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
  const hasNavigatedRef = useRef(false);
  const sessionRef = useRef<any>(null);
  const renderCountRef = useRef(0);
  const lastStateRef = useRef<any>(null);
  const editorStateRef = useRef<any>(null);

  // Online users tracking
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  const [yjsProvider, setYjsProvider] = useState<any>(null);
  const [connected, setConnected] = useState<boolean>(false);

  // Debug logging
  renderCountRef.current += 1;

  // Only log renders when there are actual changes
  const hasSignificantChanges = useMemo(() => {
    const currentState = {
      id,
      sessionId: session?.user?.id,
      isLoaded,
      hasDatabaseUser: !!databaseUser,
      documentId: document?.id,
    };

    const lastState =
      renderCountRef.current === 1 ? null : lastStateRef.current;
    lastStateRef.current = currentState;

    if (!lastState) return true; // First render

    return JSON.stringify(currentState) !== JSON.stringify(lastState);
  }, [id, session?.user?.id, isLoaded, databaseUser, document?.id]);

  if (hasSignificantChanges) {
    console.log(`🔄 EDITOR RENDER #${renderCountRef.current}`, {
      id,
      sessionExists: !!session?.user,
      sessionId: session?.user?.id,
      isLoaded,
      hasDatabaseUser: !!databaseUser,
      documentId: document?.id,
      timestamp: new Date().toISOString(),
    });
  }

  // Track session changes
  useEffect(() => {
    const oldSessionId = sessionRef.current?.user?.id;
    const newSessionId = session?.user?.id;

    if (oldSessionId !== newSessionId) {
      console.log("🔄 SESSION CHANGED", {
        oldSession: oldSessionId,
        newSession: newSessionId,
        timestamp: new Date().toISOString(),
      });
      sessionRef.current = session;
    } else if (session?.user?.id && !sessionRef.current) {
      // Only log the first session initialization
      console.log("🔄 SESSION INITIALIZED", {
        sessionId: session.user.id,
        timestamp: new Date().toISOString(),
      });
      sessionRef.current = session;
    }
  }, [session?.user?.id]);

  // Stable session check to prevent unnecessary re-renders
  const stableSession = useMemo(() => {
    return session?.user
      ? {
          id: session.user.id,
          email: session.user.email,
          name: session.user.name,
          image: session.user.image,
        }
      : null;
  }, [
    session?.user?.id,
    session?.user?.email,
    session?.user?.name,
    session?.user?.image,
  ]);

  const transformCollaboratorsForHeader = useCallback(
    (apiCollaborators: ApiCollaborator[]): Collaborator[] => {
      return apiCollaborators.map(collab => {
        const role = collab.role.toLowerCase() as "owner" | "editor" | "viewer";

        return {
          id: collab.id,
          userId: String(collab.user?.id ?? collab.userId ?? ""),
          name:
            `${collab.user.firstName} ${collab.user.lastName}`.trim() ||
            collab.user.email,
          email: collab.user.email,
          avatar: collab.user.imageUrl,
          status: "offline" as const,
          role,
          cursor: undefined,
        };
      });
    },
    []
  );

  const handleProviderReady = useCallback((provider: any) => {
    console.log("📡 Editor received provider:", !!provider);
    setYjsProvider(provider);
  }, []);

  const handleConnectionStatusChange = useCallback((isConnected: boolean) => {
    console.log("📡 Editor connection status changed:", isConnected);
    setConnected(isConnected);
  }, []);

  const userRole = useMemo(() => {
    if (!document || !databaseUser) {
      return "viewer";
    }

    if (document.ownerId === databaseUser.id) {
      return "owner";
    }

    const userCollaboration = collaborators.find(
      collab => collab.userId === databaseUser.id
    );

    if (userCollaboration) {
      const role = userCollaboration.role;
      switch (role) {
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

    if (document.isPublic) {
      return "viewer";
    }

    return "viewer";
  }, [document, databaseUser, collaborators]);

  // Memoize the entire component state to prevent unnecessary re-renders
  const componentState = useMemo(
    () => ({
      id,
      isLoaded,
      stableSession,
      databaseUser,
      document,
      userRole,
      mode,
      loading,
      error,
    }),
    [
      id,
      isLoaded,
      stableSession,
      databaseUser,
      document,
      userRole,
      mode,
      loading,
      error,
    ]
  );

  useEffect(() => {
    if (userRole === "owner" || userRole === "editor") {
      setMode("editing");
    } else {
      setMode("viewing");
    }
  }, [userRole]);

  useEffect(() => {
    if (!isLoaded || !stableSession) return;

    const fetchDatabaseUser = async () => {
      try {
        console.log("🔍 EDITOR - Fetching database user...");
        const response = await fetch("/api/users/me");

        if (response.ok) {
          const dbUser = await response.json();
          console.log("✅ EDITOR - Database user loaded:", dbUser.email);
          setDatabaseUser(dbUser);
        } else {
          console.error(
            "❌ EDITOR - Failed to sync user to database, status:",
            response.status
          );
          const errorText = await response.text();
          console.error("❌ EDITOR - Error response:", errorText);
        }
      } catch (error) {
        console.error("❌ EDITOR - Error syncing user:", error);
      }
    };

    fetchDatabaseUser();
  }, [isLoaded, stableSession]);

  useEffect(() => {
    if (isLoaded && !stableSession && !hasNavigatedRef.current) {
      console.log("🔄 NAVIGATING TO WELCOME - No session");
      hasNavigatedRef.current = true;
      router.replace("/welcome");
    }
  }, [isLoaded, stableSession, router]);

  useEffect(() => {
    console.log("🔍 EDITOR - Document fetch conditions:", {
      hasId: !!id,
      idType: typeof id,
      isLoaded,
      hasSession: !!stableSession,
      hasDatabaseUser: !!databaseUser,
      renderCount: renderCountRef.current,
    });

    if (
      !id ||
      typeof id !== "string" ||
      !isLoaded ||
      !stableSession ||
      !databaseUser
    ) {
      console.log("🔍 EDITOR - Not ready to fetch document yet");
      return;
    }

    console.log("🔍 EDITOR - Starting document fetch for:", id);

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        console.log("🔍 EDITOR - Fetching document from API...");
        // Fetch document
        const response = await fetch(`/api/documents/${id}`);

        console.log(
          "🔍 EDITOR - Document API response status:",
          response.status
        );

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
        console.log("✅ EDITOR - Document loaded successfully:", docData.title);

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

        const [commentsResponse, collaboratorsResponse] = await Promise.all([
          fetch(`/api/documents/${id}/comments`),
          fetch(`/api/documents/${id}/collaborators`),
        ]);

        if (commentsResponse.ok) {
          const commentsData = await commentsResponse.json();
          setComments(commentsData);
        } else {
          console.warn("Failed to load comments:", commentsResponse.status);
          setComments([]);
        }

        if (collaboratorsResponse.ok) {
          const collaboratorsData = await collaboratorsResponse.json();
          setCollaborators(collaboratorsData);
        } else {
          console.warn(
            "Failed to load collaborators:",
            collaboratorsResponse.status
          );
          setCollaborators([]);
        }

        setAiSuggestions([]);
      } catch (err) {
        console.error("❌ EDITOR - Error fetching document:", err);
        setError("Failed to load document data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, isLoaded, stableSession, databaseUser]);

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
    } catch (error) {
      console.error("Failed to add collaborator:", error);
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
    } catch (error) {
      console.error("Failed to remove collaborator:", error);
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
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to change role");
      }

      const updatedCollaborator = await response.json();

      setCollaborators(prev => {
        return prev.map(c =>
          c.id === collaboratorId
            ? { ...c, role: role as "OWNER" | "EDITOR" | "VIEWER" }
            : c
        );
      });
    } catch (error) {
      console.error("Failed to change role:", error);
      throw error;
    }
  };

  const handleTitleChange = async (newTitle: string): Promise<void> => {
    if (!document) return;

    try {
      setDocument(prev => (prev ? { ...prev, title: newTitle } : null));

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
    } catch (err) {
      console.error("Failed to save title:", err);
      if (document) {
        setDocument(prev => (prev ? { ...prev, title: document.title } : null));
      }
      throw err;
    }
  };

  const handleModeChange = (newMode: DocumentMode) => {
    if (newMode === "editing" && userRole === "viewer") {
      return;
    }
    setMode(newMode);
  };

  const handleContentChange = useCallback(
    (editorState: any) => {
      if (!document) return;

      try {
        const contentString = JSON.stringify(editorState);

        // Store the current editor state
        editorStateRef.current = editorState;

        // Skip if this is the initial load and content hasn't changed
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

        // Update local state for UI purposes only
        // Yjs handles all persistence
        setDocument(prev =>
          prev ? { ...prev, content: contentString } : null
        );
      } catch (err) {
        console.error("Failed to process content change:", err);
      }
    },
    [document]
  );

  // Debounced content change handler to prevent excessive re-renders
  const debouncedContentChange = useCallback(
    (() => {
      let timeoutId: NodeJS.Timeout;
      return (editorState: any) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
          handleContentChange(editorState);
        }, 100);
      };
    })(),
    [handleContentChange]
  );

  const handleAddComment = (newCommentData: ApiComment) => {
    setComments(prev => [newCommentData, ...prev]);
  };

  const handleResolveComment = (commentId: string) => {
    setComments(prev =>
      prev.map(comment =>
        comment.id === commentId ? { ...comment, resolved: true } : comment
      )
    );
  };

  const currentUserForLexical = useMemo(() => {
    if (!databaseUser) return undefined;
    return {
      id: databaseUser.id,
      name:
        `${databaseUser.firstName} ${databaseUser.lastName}`.trim() ||
        databaseUser.email,
      email: databaseUser.email,
      avatarUrl: databaseUser.imageUrl,
    };
  }, [databaseUser]);

  const collaboratorsForLexical = useMemo(() => {
    return collaborators.map(collab => ({
      user: {
        id: String(collab.user?.id ?? collab.userId ?? ""),
        name:
          `${collab.user.firstName} ${collab.user.lastName}`.trim() ||
          collab.user.email,
        email: collab.user.email,
        avatarUrl: collab.user.imageUrl,
      },
      role: collab.role.toLowerCase(),
      isOnline: false,
    }));
  }, [collaborators]);

  // Calculate unread comments count
  const unreadCommentsCount = comments.filter(c => !c.resolved).length;

  // Generate a stable key for the main component to prevent unnecessary re-mounting
  const componentKey = useMemo(() => {
    return `editor-${document?.id || "loading"}-${stableSession?.id || "no-session"}-${userRole}`;
  }, [document?.id, stableSession?.id, userRole]);

  if (!isLoaded || !stableSession || loading) {
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

  const isReadOnly = userRole === "viewer" || mode === "viewing";

  return (
    <div key={componentKey}>
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
              provider={yjsProvider}
            />

            <div className="flex flex-1 overflow-hidden">
              <div className="flex flex-1 flex-col">
                <div className="relative flex-1 overflow-auto p-4 sm:p-6">
                  <div className="mx-auto max-w-3xl rounded-lg border border-slate-200/30 dark:border-slate-700/20 sm:max-w-4xl lg:max-w-5xl xl:max-w-6xl">
                    <ErrorBoundary
                      fallback={
                        <div className="flex min-h-[400px] items-center justify-center">
                          <div className="text-center">
                            <p className="mb-4 text-lg text-red-600">
                              Editor encountered an error. Please refresh the
                              page.
                            </p>
                            <button
                              onClick={() => window.location.reload()}
                              className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
                            >
                              Refresh Page
                            </button>
                          </div>
                        </div>
                      }
                    >
                      <LexicalEditor
                        showToolbar={mode === "editing"}
                        className="min-h-full"
                        documentId={document.id}
                        readOnly={isReadOnly}
                        initialContent={
                          document.content &&
                          document.content !==
                            JSON.stringify(DEFAULT_EDITOR_STATE)
                            ? JSON.parse(document.content)
                            : editorStateRef.current || null
                        }
                        onContentChange={debouncedContentChange}
                        userRole={userRole}
                        currentUser={currentUserForLexical}
                        collaborators={collaboratorsForLexical}
                        onlineUsers={onlineUsers}
                        onProviderReady={handleProviderReady}
                        onConnectionStatusChange={handleConnectionStatusChange}
                      />
                    </ErrorBoundary>
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
                      provider={yjsProvider}
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
                          // TODO: Implement real AI suggestions API
                          setAiSuggestions([]);
                        } catch (err) {
                          console.error(
                            "Failed to refresh AI suggestions:",
                            err
                          );
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
                    collaborators={transformCollaboratorsForHeader(
                      collaborators
                    )}
                    currentUserRole={userRole}
                    provider={yjsProvider}
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
                        // TODO: Implement real AI suggestions API
                        setAiSuggestions([]);
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
    </div>
  );
}
