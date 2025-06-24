import { NextApiRequest, NextApiResponse } from "next";
import { getAuth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { userId } = getAuth(req);

    console.log("🔍 /api/users/me - Debug:", {
      userId,
      hasUserId: !!userId,
      userIdType: typeof userId,
    });

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

  
    const allUsers = await prisma.user.findMany({
      select: {
        id: true,
        clerkId: true,
        email: true,
        firstName: true,
        lastName: true,
      },
    });

    console.log("🔍 All users in database:", allUsers);


    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: {
        id: true,
        clerkId: true,
        email: true,
        firstName: true,
        lastName: true,
        imageUrl: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    console.log("🔍 User found by Clerk ID:", user);

    if (!user) {
      return res.status(404).json({
        error: "User not found in database",
        debug: {
          searchedClerkId: userId,
          allUsersInDb: allUsers.length,
          allClerkIds: allUsers.map(u => u.clerkId),
        },
      });
    }

    console.log("✅ Database user found:", { id: user.id, email: user.email });

    res.json(user);
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}
