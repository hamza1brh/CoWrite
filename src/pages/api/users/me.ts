import { NextApiRequest, NextApiResponse } from "next";
import { getUserFromRequest } from "@/lib/auth";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const user = await getUserFromRequest(req, res);

    if (!user) {
      return res.status(401).json({ error: "Authentication required" });
    }

    res.json({
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      imageUrl: user.imageUrl,
      name: `${user.firstName} ${user.lastName}`.trim(),
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    });
  } catch (error) {
    console.error("Error getting current user:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}
