export interface Collaborator {
  name: string;
  avatar: string;
}

export interface Document {
  id: number;
  title: string;
  preview: string;
  lastModified: string;
  collaborators: Collaborator[];
  isStarred: boolean;
  comments: number;
}

export const mockDocuments: Document[] = [
  {
    id: 1,
    title: "Product Requirements Document",
    preview: "/placeholder.svg?height=200&width=300",
    lastModified: "2 hours ago",
    collaborators: [
      { name: "Alice Johnson", avatar: "/placeholder.svg?height=32&width=32" },
      { name: "Bob Smith", avatar: "/placeholder.svg?height=32&width=32" },
      { name: "Carol Davis", avatar: "/placeholder.svg?height=32&width=32" },
    ],
    isStarred: true,
    comments: 12,
  },
  {
    id: 2,
    title: "Marketing Strategy 2024",
    preview: "/placeholder.svg?height=200&width=300",
    lastModified: "1 day ago",
    collaborators: [
      { name: "David Wilson", avatar: "/placeholder.svg?height=32&width=32" },
      { name: "Eva Brown", avatar: "/placeholder.svg?height=32&width=32" },
    ],
    isStarred: false,
    comments: 8,
  },
  {
    id: 3,
    title: "Technical Architecture",
    preview: "/placeholder.svg?height=200&width=300",
    lastModified: "3 days ago",
    collaborators: [
      { name: "Frank Miller", avatar: "/placeholder.svg?height=32&width=32" },
      { name: "Grace Lee", avatar: "/placeholder.svg?height=32&width=32" },
      { name: "Henry Taylor", avatar: "/placeholder.svg?height=32&width=32" },
      { name: "Ivy Chen", avatar: "/placeholder.svg?height=32&width=32" },
    ],
    isStarred: true,
    comments: 24,
  },
];

// Function to simulate fetching documents 
export async function getDocuments(): Promise<Document[]> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));
  return mockDocuments;
}

export interface DocumentData {
  id: string;
  title: string;
  content: string;
  lastModified: string;
  createdAt: string;
  ownerId: number;
  collaboratorIds: number[];
}

export const mockDocument: DocumentData = {
  id: "1",
  title: "Product Requirements Document",
  content: "", // This will be managed by Lexical
  lastModified: new Date().toISOString(),
  createdAt: "2024-01-15T10:00:00Z",
  ownerId: 1,
  collaboratorIds: [1, 2, 3],
};

// Function to get document by ID
export async function getDocument(
  documentId: string
): Promise<DocumentData | null> {
  await new Promise(resolve => setTimeout(resolve, 300));

  if (documentId === "new") {
    return {
      id: "new",
      title: "Untitled Document",
      content: "",
      lastModified: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      ownerId: 1,
      collaboratorIds: [1],
    };
  }

  return { ...mockDocument, id: documentId };
}

// Function to update document
export async function updateDocument(
  documentId: string,
  updates: Partial<DocumentData>
): Promise<DocumentData> {
  await new Promise(resolve => setTimeout(resolve, 200));
  return {
    ...mockDocument,
    ...updates,
    lastModified: new Date().toISOString(),
  };
}

// Function to save document content
export async function saveDocumentContent(
  documentId: string,
  content: string
): Promise<void> {
  await new Promise(resolve => setTimeout(resolve, 150));
  // change this save to database later
  console.log(
    `Saved document ${documentId} with content length: ${content.length}`
  );
}
