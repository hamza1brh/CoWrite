import { NextApiRequest, NextApiResponse } from "next";
import { requireAuthenticatedUser } from "@/lib/auth-guards";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    console.log("🔍 DEBUG API - Starting documents API debug");

    // Test authentication
    const user = await requireAuthenticatedUser(req, res);
    console.log("✅ User authenticated:", user.email);

    return res.json({
      status: "success",
      message: "Documents API debug successful",
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("❌ DEBUG API ERROR:", error);
    return res.status(500).json({
      error: "Debug failed",
      message: error instanceof Error ? error.message : String(error),
    });
  }
}
