import { Role } from "@prisma/client";

// Base Prisma types
export interface User {
  id: string;
  clerkId: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  imageUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Document {
  id: string;
  title: string;
  content: any; // JSON from Prisma
  coverImage: string | null;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
  ownerId: string;
}

export interface Comment {
  id: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  documentId: string;
  authorId: string;
  resolved?: boolean;
}

export interface DocumentCollaborator {
  id: string;
  role: Role;
  joinedAt: string;
  documentId: string;
  userId: string;
}

// UI Component Types
export type DocumentMode = "viewing" | "editing";
export type UserRole = "owner" | "editor" | "viewer";

// Document Data Types
export interface DocumentData {
  id: string;
  title: string;
  content: string;
  lastModified: string;
  createdAt: string;
  ownerId: string;
  collaboratorIds: string[];
}

// Collaborator UI Type
export interface Collaborator {
  id: number; //  UI mock data
  name: string;
  avatar: string;
  status: "online" | "away" | "offline";
  cursor: { x: number; y: number } | null;
  lastActive?: string;
}

// ✅ Fix AISuggestion to match mock data structure
export interface AISuggestion {
  id: number; //  mock data
  type: "grammar" | "style" | "content";
  title: string;
  description: string;
  // Remove suggestion field since mock data doesn't have it
  confidence: number;
}

// ✅ Mock Comment Type
export interface MockComment {
  id: number;
  content: string;
  author: string;
  timestamp: string;
  resolved: boolean;
}

// API Response types (with relations)
export interface DocumentWithOwner extends Document {
  owner: User;
  _count: {
    comments: number;
  };
}

export interface DocumentWithDetails extends Document {
  owner: User;
  comments: CommentWithAuthor[];
}

export interface CommentWithAuthor extends Comment {
  author: User;
}

export interface CollaboratorWithUser extends DocumentCollaborator {
  user: User;
}

export interface UserWithStats extends User {
  ownedDocuments: Document[];
  collaboratorOn: CollaboratorWithDocument[];
  _count: {
    ownedDocuments: number;
    collaboratorOn: number;
    comments: number;
  };
}

export interface CollaboratorWithDocument extends DocumentCollaborator {
  document: Document;
}

// Request/Response types
export interface CreateDocumentRequest {
  title?: string;
}

export interface UpdateDocumentRequest {
  title?: string;
  content?: any;
}

export interface CreateCommentRequest {
  content: string;
}

export interface UpdateCommentRequest {
  content?: string;
  resolved?: boolean;
}

export interface CreateCollaboratorRequest {
  userId: string;
  role: Role;
}

export interface UpdateCollaboratorRequest {
  role: Role;
}

// Frontend display types
export interface DocumentCardData {
  id: string;
  title: string;
  preview: string;
  lastModified: string;
  owner: {
    firstName: string | null;
    lastName: string | null;
    imageUrl: string | null;
  };
  collaborators: CollaboratorWithUser[];
  isStarred: boolean;
  comments: number;
}

// Editor Header Props Interface
export interface EditorHeaderProps {
  documentTitle: string;
  onTitleChange: (newTitle: string) => Promise<void>;
  collaborators: Collaborator[];
  showAI: boolean;
  showComments: boolean;
  onToggleAI: () => void;
  onToggleComments: () => void;
  unreadCommentsCount: number;
  mode: DocumentMode;
  userRole: UserRole;
  onModeChange: (mode: DocumentMode) => void;
  isDocumentOwner: boolean;
  saveStatus?: "saved" | "saving" | "error";
  lastSaved?: Date | null;
}
