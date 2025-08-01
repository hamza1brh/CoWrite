import { NextApiRequest, NextApiResponse } from "next";
import { requireAuthenticatedUser } from "@/lib/auth-guards";
import { aiServiceManager, AIRequest } from "@/lib/ai-service-manager";
import { AISuggestion } from "@/lib/types/api";

function createAISuggestion(
  type: AISuggestion["type"],
  originalText: string,
  suggestedText: string,
  title: string,
  description: string
): AISuggestion {
  return {
    id: `ai-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    type,
    title,
    description,
    originalText,
    suggestedText,
  };
}

async function processAIRequest(
  text: string,
  task: string,
  options: any = {}
): Promise<string> {
  const request: AIRequest = {
    text,
    task: task as "grammar" | "summary" | "improve" | "custom",
    options: {
      temperature: options.temperature || 0.1,
      maxTokens: options.maxTokens || 512,
      model: options.model,
      customPrompt: options.customPrompt, // Add custom prompt support
    },
  };

  const response = await aiServiceManager.processRequest(request);

  if (response.success && response.result) {
    return response.result;
  } else {
    console.error(`AI processing failed: ${response.error}`);
    return text;
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    await requireAuthenticatedUser(req, res);

    const { task, selectedText, options = {} } = req.body;

    if (!task || !selectedText || selectedText.trim().length === 0) {
      return res
        .status(400)
        .json({ error: "Task and selectedText are required" });
    }

    let result;

    // Handle all supported tasks including custom
    if (!["grammar", "summary", "improve", "custom"].includes(task)) {
      return res.status(400).json({
        error:
          "Only grammar, summary, improve, and custom tasks are currently supported",
      });
    }

    // For custom tasks, ensure customPrompt is provided
    if (task === "custom" && !options.customPrompt) {
      return res.status(400).json({
        error: "customPrompt is required for custom tasks",
      });
    }

    const processedText = await processAIRequest(selectedText, task, options);

    const suggestionTypes = {
      grammar: "correction",
      summary: "summary",
      improve: "improvement",
      custom: "custom",
    };

    const titles = {
      grammar: "Grammar & Spelling Correction",
      summary: "Text Summary",
      improve: "Writing Improvement",
      custom: options.customTitle || "Custom AI Processing",
    };

    const descriptions = {
      grammar: "AI-corrected grammar and spelling mistakes",
      summary: "AI-generated summary of the selected text",
      improve: "AI-improved writing style and clarity",
      custom: options.customDescription || "Custom AI-processed text",
    };

    result = createAISuggestion(
      suggestionTypes[
        task as keyof typeof suggestionTypes
      ] as AISuggestion["type"],
      selectedText,
      processedText,
      titles[task as keyof typeof titles],
      descriptions[task as keyof typeof descriptions]
    );

    return res.json({ success: true, result });
  } catch (error) {
    console.error("AI API error:", error);

    if (error instanceof Error) {
      if (
        error.message === "Authentication required" ||
        error.message === "Invalid session" ||
        error.message === "Email verification required"
      ) {
        return res.status(401).json({ error: error.message });
      }
      if (error.message === "User not found") {
        return res.status(404).json({ error: error.message });
      }
    }

    return res.status(500).json({
      error: "Internal server error",
      details:
        process.env.NODE_ENV === "development"
          ? error instanceof Error
            ? error.message
            : String(error)
          : undefined,
    });
  }
}
