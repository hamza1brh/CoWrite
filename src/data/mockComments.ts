export interface Comment {
  id: number;
  author: string;
  avatar: string;
  content: string;
  timestamp: string;
  resolved: boolean;
  replies?: Comment[];
}

export const mockComments: Comment[] = [
  {
    id: 1,
    author: "Alice Johnson",
    avatar: "/placeholder.svg?height=32&width=32",
    content: "This section needs more detail about the user journey.",
    timestamp: "2 hours ago",
    resolved: false,
    replies: [
      {
        id: 4,
        author: "John Doe",
        avatar: "/placeholder.svg?height=32&width=32",
        content: "I agree, let me add more details about the onboarding flow.",
        timestamp: "1 hour ago",
        resolved: false,
      },
    ],
  },
  {
    id: 2,
    author: "Bob Smith",
    avatar: "/placeholder.svg?height=32&width=32",
    content:
      "Great point about the technical constraints. Should we add a diagram?",
    timestamp: "1 hour ago",
    resolved: false,
  },
  {
    id: 3,
    author: "Carol Davis",
    avatar: "/placeholder.svg?height=32&width=32",
    content: "Updated the requirements based on stakeholder feedback.",
    timestamp: "30 minutes ago",
    resolved: true,
  },
];

// Function to simulate fetching comments 
export async function getComments(documentId: string): Promise<Comment[]> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 300));
  return mockComments;
}

// Function to add a new comment
export async function addComment(
  documentId: string,
  content: string,
  author: string
): Promise<Comment> {
  const newComment: Comment = {
    id: Date.now(),
    author,
    avatar: "/placeholder.svg?height=32&width=32",
    content,
    timestamp: "Just now",
    resolved: false,
  };

  // Simulate API call
  await new Promise(resolve => setTimeout(resolve, 200));
  return newComment;
}

// Function to resolve a comment
export async function resolveComment(commentId: number): Promise<void> {
  await new Promise(resolve => setTimeout(resolve, 200));
}
