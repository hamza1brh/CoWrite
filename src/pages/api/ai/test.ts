import { NextApiRequest, NextApiResponse } from "next";
import { aiServiceManager } from "@/lib/ai-service-manager";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // Test a simple request
    const testRequest = {
      text: "Hello world, this is a test.",
      task: "grammar" as const,
      options: {
        temperature: 0.7,
        maxTokens: 100,
      },
    };

    const testResponse = await aiServiceManager.processRequest(testRequest);

    res.status(200).json({
      message: "AI Service Test Results",
      testRequest,
      testResponse,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("AI service test error:", error);
    res.status(500).json({
      error: "AI service test failed",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
