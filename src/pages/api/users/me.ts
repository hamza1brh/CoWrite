import { NextApiRequest, NextApiResponse } from "next";
import { syncUserToDatabase } from "@/lib/user-sync";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const user = await syncUserToDatabase(req);

    if (!user) {
      return res.status(401).json({ error: "Authentication required" });
    }

    res.json(user);
  } catch (error) {
    console.error("Error syncing user:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}
