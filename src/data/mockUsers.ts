export interface Collaborator {
  id: number;
  name: string;
  avatar: string;
  status: "online" | "away" | "offline";
  cursor: { x: number; y: number } | null;
  lastActive?: string;
}

export const mockCollaborators: Collaborator[] = [
  {
    id: 1,
    name: "Alice Johnson",
    avatar: "/placeholder.svg?height=32&width=32",
    status: "online",
    cursor: { x: 45, y: 23 },
    lastActive: "now",
  },
  {
    id: 2,
    name: "Bob Smith",
    avatar: "/placeholder.svg?height=32&width=32",
    status: "online",
    cursor: { x: 67, y: 45 },
    lastActive: "2 minutes ago",
  },
  {
    id: 3,
    name: "Carol Davis",
    avatar: "/placeholder.svg?height=32&width=32",
    status: "away",
    cursor: null,
    lastActive: "15 minutes ago",
  },
];

// Function to simulate fetching collaborators 
export async function getCollaborators(
  documentId: string
): Promise<Collaborator[]> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 200));
  return mockCollaborators;
}

// Function to update cursor position
export async function updateCursorPosition(
  documentId: string,
  userId: number,
  position: { x: number; y: number }
): Promise<void> {
  // Simulate real-time cursor updates
  await new Promise(resolve => setTimeout(resolve, 50));
}

// Function to update user status
export async function updateUserStatus(
  documentId: string,
  userId: number,
  status: "online" | "away" | "offline"
): Promise<void> {
  await new Promise(resolve => setTimeout(resolve, 100));
}
