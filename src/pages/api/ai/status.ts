import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const response = {
      timestamp: new Date().toISOString(),
      summary: {
        status: "simplified - no health checks",
        message:
          "AI service manager simplified to focus on processing requests only",
      },
    };

    return res.json(response);
  } catch (error) {
    console.error("AI status check error:", error);
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
