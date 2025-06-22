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
}

export interface DocumentCollaborator {
  id: string;
  role: Role;
  joinedAt: string;
  documentId: string;
  userId: string;
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
