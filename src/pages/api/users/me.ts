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
    const user = await requireAuthenticatedUser(req, res);

    // Use name if firstName/lastName are null, otherwise construct from parts
    const displayName =
      user.firstName && user.lastName
        ? `${user.firstName} ${user.lastName}`.trim()
        : user.name || user.email;

    res.json({
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      imageUrl: user.imageUrl,
      name: displayName,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      emailVerified: user.emailVerified,
    });
  } catch (error) {
    console.error("Error getting current user:", error);

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

    res.status(500).json({ error: "Internal server error" });
  }
}
