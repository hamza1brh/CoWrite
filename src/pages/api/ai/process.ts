import { NextApiRequest, NextApiResponse } from "next";
import { requireAuthenticatedUser } from "@/lib/auth-guards";
import { aiServiceManager, AIRequest } from "@/lib/ai-service-manager";
import { AISuggestion } from "@/lib/types/api";

function createAISuggestion(
  type: AISuggestion["type"],
  originalText: string,
  suggestedText: string,
  title: string,
  description: string,
  confidence: number = 85
): AISuggestion {
  return {
    id: `ai-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    type,
    title,
    description,
    originalText,
    suggestedText,
    confidence,
  };
}

async function processAIRequest(
  task: string,
  text: string,
  options: any = {}
): Promise<string> {
  const request: AIRequest = {
    text,
    task: task as any,
    options: {
      temperature: options.temperature || 0.1,
      maxTokens: options.maxTokens || 512,
      model: options.model,
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

    switch (task) {
      case "grammar":
        const correctedText = await processAIRequest(
          task,
          selectedText,
          options
        );
        result = createAISuggestion(
          "correction",
          selectedText,
          correctedText,
          "Grammar & Spelling Correction",
          "AI-corrected grammar and spelling mistakes",
          90
        );
        break;

      case "improve":
        const improvedText = await processAIRequest(
          task,
          selectedText,
          options
        );
        result = createAISuggestion(
          "improvement",
          selectedText,
          improvedText,
          "Improve Writing Style",
          "AI-improved writing style for clarity and flow",
          85
        );
        break;

      case "summarize":
        const summary = await processAIRequest(task, selectedText, options);
        result = createAISuggestion(
          "summary",
          selectedText,
          summary,
          "Text Summary",
          "AI-generated summary of the selected text",
          80
        );
        break;

      case "custom":
        const customResult = await processAIRequest(
          task,
          selectedText,
          options
        );
        result = createAISuggestion(
          "custom",
          selectedText,
          customResult,
          options.customTitle || "Custom AI Task",
          options.customDescription || "Custom AI processing result",
          75
        );
        break;

      default:
        return res.status(400).json({
          error:
            "Invalid task type. Supported: grammar, improve, summarize, custom",
        });
    }

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
