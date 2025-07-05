import { NextApiRequest, NextApiResponse } from "next";
import { getUserFromRequest } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const user = await getUserFromRequest(req, res);
    
    console.log("🔍 User lookup request:", {
      id: user.id,
      email: user.email,
    });

    return res.json(user);
  } catch (error) {
    console.error("❌ Error in user lookup:", error);

    if (error instanceof Error && error.message === "Unauthorized") {
      return res.status(401).json({ error: "Authentication required" });
    }

    res.status(500).json({
      error: "Internal server error",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
