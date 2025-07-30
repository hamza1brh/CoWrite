import { NextApiRequest, NextApiResponse } from "next";
import { requireAuthenticatedUser } from "@/lib/auth-guards";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    console.log("🔍 Debug Auth Test - Starting");
    const user = await requireAuthenticatedUser(req, res);
    console.log("✅ Debug Auth Test - User authenticated:", user.email);

    return res.status(200).json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
      },
    });
  } catch (error) {
    console.error("❌ Debug Auth Test - Error:", error);

    // Handle authentication errors specifically
    if (
      error instanceof Error &&
      error.message.includes("Authentication required")
    ) {
      return res.status(401).json({ error: "Authentication required" });
    }
    if (error instanceof Error && error.message.includes("User not found")) {
      return res.status(404).json({ error: "User not found" });
    }
    if (error instanceof Error && error.message.includes("Invalid session")) {
      return res.status(401).json({ error: "Invalid session" });
    }

    return res.status(500).json({
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
