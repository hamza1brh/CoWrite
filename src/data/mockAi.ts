export interface AISuggestion {
  id: string;
  type: "improvement" | "addition" | "correction" | "formatting";
  title: string;
  description: string;
  confidence: number; // 0-100
  appliedAt?: string;
}

export interface AIResponse {
  id: string;
  content: string;
  timestamp: string;
  type: "suggestion" | "completion" | "rewrite";
}

export const mockAISuggestions: AISuggestion[] = [
  {
    id: "ai-1",
    type: "addition",
    title: "Add accessibility requirements",
    description:
      "Consider adding a section about WCAG 2.1 compliance and accessibility standards for better user experience.",
    confidence: 85,
  },
  {
    id: "ai-2",
    type: "improvement",
    title: "Include performance metrics",
    description:
      "Define specific performance benchmarks such as page load times, response times, and throughput requirements.",
    confidence: 92,
  },
  {
    id: "ai-3",
    type: "addition",
    title: "Expand security considerations",
    description:
      "Add details about data encryption, authentication methods, and security compliance requirements.",
    confidence: 78,
  },
  {
    id: "ai-4",
    type: "improvement",
    title: "Add user personas",
    description:
      "Include detailed user personas to better define the target audience and their specific needs.",
    confidence: 88,
  },
];

// Function to get AI suggestions for a document - Fixed parameter type
export async function getAISuggestions(
  documentId: string,
  content?: string
): Promise<AISuggestion[]> {
  // Validate documentId
  if (!documentId || documentId === "undefined") {
    throw new Error("Document ID is required");
  }

  // Simulate AI processing time
  await new Promise(resolve => setTimeout(resolve, 800));
  return mockAISuggestions;
}

// Function to apply an AI suggestion
export async function applyAISuggestion(suggestionId: string): Promise<string> {
  if (!suggestionId) {
    throw new Error("Suggestion ID is required");
  }

  // Simulate applying the suggestion and returning updated content
  await new Promise(resolve => setTimeout(resolve, 400));
  return "Applied suggestion content...";
}

// Function to get AI completion/rewrite
export async function getAICompletion(
  prompt: string,
  context: string
): Promise<AIResponse> {
  if (!prompt) {
    throw new Error("Prompt is required");
  }

  await new Promise(resolve => setTimeout(resolve, 1200));

  const responses = [
    "Based on the context, I suggest expanding this section with more detailed user scenarios and edge cases.",
    "Here's a more comprehensive approach to this requirement that includes technical specifications and acceptance criteria.",
    "Consider restructuring this section to improve clarity and add measurable success metrics.",
  ];

  const randomIndex = Math.floor(Math.random() * responses.length);
  const content = responses[randomIndex]!;

  return {
    id: `ai-response-${Date.now()}`,
    content,
    timestamp: new Date().toISOString(),
    type: "completion",
  };
}
