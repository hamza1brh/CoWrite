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
import { $getSelection, $isRangeSelection, $getRoot } from "lexical";
import { $createTextNode } from "lexical";

import type { CollaboratorWithUser } from "@/lib/types/api";
import type { TypewriterAnimationRef } from "@/components/lexical/plugins/TypewriterAnimationPlugin";

import { AISuggestion } from "@/lib/types/api";

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
    name: string;
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
    name: string | null;
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
  const [selectedText, setSelectedText] = useState<string>("");

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
  const editorRef = useRef<any>(null);
  const typewriterAnimationRef = useRef<TypewriterAnimationRef | null>(null);

  // Online users tracking - memoized to prevent re-renders
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  const [yjsProvider, setYjsProvider] = useState<any>(null);
  const [connected, setConnected] = useState<boolean>(false);

  // Stabilize online users updates to prevent excessive re-renders
  const updateOnlineUsers = useCallback((newUsers: Set<string>) => {
    setOnlineUsers(prev => {
      // Only update if the set actually changed
      if (prev.size !== newUsers.size) return newUsers;

      // Check if any user is different
      const prevArray = Array.from(prev);
      const newArray = Array.from(newUsers);

      for (let i = 0; i < newArray.length; i++) {
        if (!prev.has(newArray[i])) return newUsers;
      }
      for (let i = 0; i < prevArray.length; i++) {
        if (!newUsers.has(prevArray[i])) return newUsers;
      }

      return prev; // No change, return previous reference
    });
  }, []);

  // Increment render count for debugging purposes
  useEffect(() => {
    renderCountRef.current += 1;
  });

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    session?.user?.id,
    session?.user?.email,
    session?.user?.name,
    session?.user?.image,
  ]);

  // Memoize transformed collaborators to prevent re-renders
  const transformedCollaborators = useMemo(() => {
    return collaborators.map(collab => {
      const role = collab.role.toLowerCase() as "owner" | "editor" | "viewer";

      const displayName =
        collab.user.firstName && collab.user.lastName
          ? `${collab.user.firstName} ${collab.user.lastName}`.trim()
          : (collab.user as any).name || collab.user.email;

      return {
        id: collab.id,
        userId: String(collab.user?.id ?? collab.userId ?? ""),
        name: displayName,
        email: collab.user.email,
        avatar: collab.user.imageUrl,
        status: "offline" as const,
        role,
        cursor: undefined,
      };
    });
  }, [collaborators]);

  const handleProviderReady = useCallback(
    (provider: any) => {
      if (yjsProvider !== provider) {
        setYjsProvider(provider);
      }
    },
    [yjsProvider]
  );

  const handleConnectionStatusChange = useCallback((isConnected: boolean) => {
    setConnected(prev => (prev !== isConnected ? isConnected : prev));
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [document?.ownerId, document?.isPublic, databaseUser?.id, collaborators]);

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
        const response = await fetch("/api/users/me");

        if (response.ok) {
          const dbUser = await response.json();
          setDatabaseUser(dbUser);
        } else {
          console.error(
            "Failed to sync user to database, status:",
            response.status
          );
        }
      } catch (error) {
        console.error("Error syncing user:", error);
      }
    };

    fetchDatabaseUser();
  }, [isLoaded, stableSession]);

  useEffect(() => {
    if (isLoaded && !stableSession && !hasNavigatedRef.current) {
      hasNavigatedRef.current = true;
      router.replace("/welcome");
    }
  }, [isLoaded, stableSession, router]);

  useEffect(() => {
    if (
      !id ||
      typeof id !== "string" ||
      !isLoaded ||
      !stableSession ||
      !databaseUser
    ) {
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

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
          setComments([]);
        }

        if (collaboratorsResponse.ok) {
          const collaboratorsData = await collaboratorsResponse.json();
          setCollaborators(collaboratorsData);
        } else {
          setCollaborators([]);
        }

        setAiSuggestions([]);
      } catch (err) {
        console.error("Error fetching document:", err);
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
      const currentDocument = document;
      if (!currentDocument) return;

      try {
        const contentString = JSON.stringify(editorState);

        editorStateRef.current = editorState;

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
        lastSavedContentRef.current = contentString;
      } catch (err) {
        console.error("Failed to process content change:", err);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  // Debounced content change handler to prevent excessive re-renders
  const debouncedTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (debouncedTimeoutRef.current) {
        clearTimeout(debouncedTimeoutRef.current);
      }
    };
  }, []);

  const debouncedContentChange = useCallback(
    (editorState: any) => {
      if (debouncedTimeoutRef.current) {
        clearTimeout(debouncedTimeoutRef.current);
      }

      debouncedTimeoutRef.current = setTimeout(() => {
        handleContentChange(editorState);
        debouncedTimeoutRef.current = undefined;
      }, 300);
    },
    [handleContentChange]
  );

  const handleAddComment = (newCommentData: ApiComment) => {
    setComments(prev => [newCommentData, ...prev]);
  };

  const handleResolveComment = async (commentId: string) => {
    try {
      setComments(prev =>
        prev.map(comment =>
          comment.id === commentId ? { ...comment, resolved: true } : comment
        )
      );
    } catch (err) {
      console.error("Failed to resolve comment:", err);
    }
  };

  // Handle text selection changes in the editor
  const handleSelectionChange = useCallback((selectedTextContent: string) => {
    setSelectedText(selectedTextContent);
  }, []);

  const handleTypewriterAnimationReady = useCallback(
    (ref: TypewriterAnimationRef) => {
      typewriterAnimationRef.current = ref;
    },
    []
  );

  const handleApplySuggestionWithAnimation = useCallback(
    async (suggestion: AISuggestion): Promise<void> => {
      try {
        if (typewriterAnimationRef.current) {
          await typewriterAnimationRef.current.applyTextWithAnimation(
            suggestion.originalText,
            suggestion.suggestedText
          );
        } else {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }

        setAiSuggestions(prev => [
          { ...suggestion, appliedAt: new Date().toISOString() },
          ...prev.filter(s => s.id !== suggestion.id),
        ]);
      } catch (error) {
        console.error("Error applying suggestion with animation:", error);
      }
    },
    []
  );

  const handleApplySuggestion = useCallback((suggestion: AISuggestion) => {
    setAiSuggestions(prev => [
      { ...suggestion, appliedAt: new Date().toISOString() },
      ...prev.filter(s => s.id !== suggestion.id),
    ]);
  }, []);

  const handleRejectSuggestion = useCallback((suggestionId: string) => {
    setAiSuggestions(prev => prev.filter(s => s.id !== suggestionId));
  }, []);

  const currentUserForLexical = useMemo(() => {
    if (!databaseUser) return undefined;

    const displayName =
      databaseUser.firstName && databaseUser.lastName
        ? `${databaseUser.firstName} ${databaseUser.lastName}`.trim()
        : databaseUser.name || databaseUser.email;

    return {
      id: databaseUser.id,
      name: displayName,
      email: databaseUser.email,
      avatarUrl: databaseUser.imageUrl,
    };
  }, [databaseUser]);

  const collaboratorsForLexical = useMemo(() => {
    return collaborators.map(collab => {
      const displayName =
        collab.user.firstName && collab.user.lastName
          ? `${collab.user.firstName} ${collab.user.lastName}`.trim()
          : collab.user.name || collab.user.email;

      return {
        user: {
          id: String(collab.user?.id ?? collab.userId ?? ""),
          name: displayName,
          email: collab.user.email,
          avatarUrl: collab.user.imageUrl,
        },
        role: collab.role.toLowerCase(),
        isOnline: false,
      };
    });
  }, [collaborators]);

  // Calculate unread comments count
  const unreadCommentsCount = useMemo(() => {
    return comments.filter(c => !c.resolved).length;
  }, [comments]);

  // Toggle handlers
  const handleToggleAI = useCallback(() => {
    setShowAI(!showAI);
  }, [showAI]);

  const handleToggleComments = useCallback(() => {
    setShowComments(!showComments);
  }, [showComments]);

  const handleToggleCollaborators = useCallback(() => {
    setShowCollaborators(!showCollaborators);
  }, [showCollaborators]);

  const handleCloseAI = useCallback(() => {
    setShowAI(false);
  }, []);

  const handleCloseComments = useCallback(() => {
    setShowComments(false);
  }, []);

  const handleCloseCollaborators = useCallback(() => {
    setShowCollaborators(false);
  }, []);

  const handleCloseMobilePanels = useCallback(() => {
    setShowAI(false);
    setShowComments(false);
    setShowCollaborators(false);
  }, []);

  const handleRefreshSuggestions = useCallback(async () => {
    if (!document?.id) return;
    try {
      setAiSuggestions([]);
    } catch (err) {
      console.error("Failed to refresh AI suggestions:", err);
    }
  }, [document?.id]);

  // Memoize isReadOnly to prevent re-renders
  const isReadOnly = useMemo(() => {
    return userRole === "viewer" || mode === "viewing";
  }, [userRole, mode]);

  // Memoize stable props for LexicalEditor to prevent re-renders
  const lexicalEditorProps = useMemo(
    () => ({
      showToolbar: mode === "editing",
      className: "min-h-full",
      documentId: document?.id || "",
      readOnly: isReadOnly,
      initialContent:
        document?.content &&
        document.content !== JSON.stringify(DEFAULT_EDITOR_STATE)
          ? JSON.parse(document.content)
          : editorStateRef.current || null,
      onContentChange: debouncedContentChange,
      userRole: userRole as "owner" | "editor" | "viewer",
      currentUser: currentUserForLexical,
      collaborators: collaboratorsForLexical,
      onlineUsers,
      onProviderReady: handleProviderReady,
      onConnectionStatusChange: handleConnectionStatusChange,
      onSelectionChange: handleSelectionChange,
      onTypewriterAnimationReady: handleTypewriterAnimationReady,
    }),
    [
      mode,
      document?.id,
      document?.content,
      isReadOnly,
      debouncedContentChange,
      userRole,
      currentUserForLexical,
      collaboratorsForLexical,
      onlineUsers,
      handleProviderReady,
      handleConnectionStatusChange,
      handleSelectionChange,
      handleTypewriterAnimationReady,
    ]
  );

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

  return (
    <div>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <div className="dark:dark-gradient-bg flex min-h-screen flex-col bg-slate-50">
            <EditorHeader
              documentTitle={document.title}
              onTitleChange={handleTitleChange}
              collaborators={transformedCollaborators}
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
                      <LexicalEditor {...lexicalEditorProps} />
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
                      onClose={handleCloseCollaborators}
                      collaborators={transformedCollaborators}
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
                      onClose={handleCloseAI}
                      suggestions={aiSuggestions}
                      selectedText={selectedText}
                      onApplySuggestion={handleApplySuggestion}
                      onApplySuggestionWithAnimation={
                        handleApplySuggestionWithAnimation
                      }
                      onRefreshSuggestions={handleRefreshSuggestions}
                      onRejectSuggestion={handleRejectSuggestion}
                    />
                  </div>
                )}

                {showComments && (
                  <div className="w-80 border-l border-slate-200/50 bg-white/60 backdrop-blur-sm dark:border-slate-700/20 dark:bg-slate-800/60">
                    <CommentsPanel
                      isOpen={true}
                      onClose={handleCloseComments}
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
                  onClick={handleCloseMobilePanels}
                />
              )}

              {showCollaborators && (
                <div className="fixed right-0 top-0 z-50 h-full w-full max-w-sm bg-white shadow-xl dark:bg-slate-900">
                  <CollaboratorPanel
                    isOpen={true}
                    onClose={handleCloseCollaborators}
                    collaborators={transformedCollaborators}
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
                    onClose={handleCloseAI}
                    suggestions={aiSuggestions}
                    selectedText={selectedText}
                    onApplySuggestion={handleApplySuggestion}
                    onApplySuggestionWithAnimation={
                      handleApplySuggestionWithAnimation
                    }
                    onRefreshSuggestions={handleRefreshSuggestions}
                    onRejectSuggestion={handleRejectSuggestion}
                  />
                </div>
              )}

              {showComments && (
                <div className="fixed right-0 top-0 z-50 h-full w-full max-w-sm bg-white shadow-xl dark:bg-slate-900">
                  <CommentsPanel
                    isOpen={true}
                    onClose={handleCloseComments}
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
